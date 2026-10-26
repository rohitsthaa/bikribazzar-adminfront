"use client";

import { useState, useTransition } from "react";
import ImageUploader from "@/components/ImageUploader";
import MarkdownEditor from "@/components/MarkdownEditor";
import { PageEditorSection, inputCls, btnCls } from "../PageEditorSection";
import { saveAboutContent, savePageVisibility } from "../actions";

export default function AboutContentClient({
  initialTitle,
  initialBody,
  initialImage,
  initialEnabled,
  globallyHidden,
}: {
  initialTitle: string;
  initialBody: string;
  initialImage: string;
  initialEnabled: boolean;
  globallyHidden: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [image, setImage] = useState(initialImage);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saved, setSaved] = useState(false);
  const [toggleSaved, setToggleSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [togglePending, startToggle] = useTransition();

  function toggle(next: boolean) {
    setEnabled(next);
    setToggleSaved(false);
    startToggle(async () => {
      const result = await savePageVisibility("about", next);
      if (result.error) setEnabled(!next);
      else {
        setToggleSaved(true);
        setTimeout(() => setToggleSaved(false), 1500);
      }
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError("");
    start(async () => {
      const result = await saveAboutContent(title, body, image);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      {globallyHidden && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The About page is currently hidden across all stores by a platform setting. You can still edit its content here.
        </p>
      )}
      <PageEditorSection
        title="About page"
        hint="Shown at /about on your storefront"
        enabled={enabled}
        onToggle={toggle}
        pending={togglePending}
        saved={toggleSaved}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Page title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Story" maxLength={120} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">Body text</label>
            <MarkdownEditor name="aboutBody" defaultValue={body} onChange={setBody} placeholder="Tell your story — who you are, how you make things, what drives you…" rows={6} />
            <p className="mt-1 text-xs text-stone-400">{body.length} / 3000</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-stone-500">About and story image <span className="font-normal text-stone-400">(optional)</span></p>
            <ImageUploader value={image} onChange={(url) => { setImage(url); setSaved(false); }} />
            <p className="mt-1.5 text-xs text-stone-400">Shown on your About page and homepage story section. Portrait images work well.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className={btnCls}>{pending ? "Saving…" : "Save"}</button>
            {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </PageEditorSection>
    </div>
  );
}
