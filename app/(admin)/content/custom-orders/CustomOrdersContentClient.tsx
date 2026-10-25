"use client";

import { useState, useTransition } from "react";
import CustomPageEditor from "../CustomPageEditor";
import MarkdownEditor from "@/components/MarkdownEditor";
import type { CustomPageConfig } from "@/lib/custom-page-config";
import { PageEditorSection, inputCls, btnCls } from "../PageEditorSection";
import { saveCustomContent, savePageVisibility } from "../actions";

export default function CustomOrdersContentClient({
  initialTitle,
  initialBody,
  initialEnabled,
  initialConfig,
}: {
  initialTitle: string;
  initialBody: string;
  initialEnabled: boolean;
  initialConfig: CustomPageConfig;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [config, setConfig] = useState(initialConfig);
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
      const result = await savePageVisibility("custom", next);
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
      const result = await saveCustomContent(title, body, config);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <PageEditorSection
      title="Custom orders page"
      hint="Shown at /custom — for bespoke enquiries"
      enabled={enabled}
      onToggle={toggle}
      pending={togglePending}
      saved={toggleSaved}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">Page title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Custom Orders" maxLength={120} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">Description</label>
          <MarkdownEditor name="customBody" defaultValue={body} onChange={setBody} placeholder="Describe how customers can enquire about bespoke or custom pieces…" rows={5} />
        </div>
        <CustomPageEditor value={config} onChange={(value) => { setConfig(value); setSaved(false); }} disabled={pending} />
        <p className="text-xs text-stone-400">Customers submit their custom request through a form on this page — requests land in <a href="/orders" className="underline hover:text-stone-700">Orders</a> tagged “Custom”.</p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={btnCls}>{pending ? "Saving…" : "Save"}</button>
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </PageEditorSection>
  );
}
