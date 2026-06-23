'use client';

import { useState, useTransition } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { saveAboutContent, saveCustomContent } from './actions';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';
const textareaCls = `${inputCls} resize-y min-h-[120px]`;
const btnCls = 'px-5 py-2 rounded-lg bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] disabled:opacity-50 transition-colors';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-stone-900">{title}</h2>
        {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

interface Props {
  initialAboutTitle: string;
  initialAboutBody: string;
  initialAboutImage: string;
  initialCustomTitle: string;
  initialCustomBody: string;
  whatsapp: string;
}

export default function ContentClient({
  initialAboutTitle, initialAboutBody, initialAboutImage,
  initialCustomTitle, initialCustomBody, whatsapp,
}: Props) {
  // About
  const [aboutTitle, setAboutTitle] = useState(initialAboutTitle);
  const [aboutBody, setAboutBody] = useState(initialAboutBody);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isPendingAbout, startAbout] = useTransition();

  // Custom
  const [customTitle, setCustomTitle] = useState(initialCustomTitle);
  const [customBody, setCustomBody] = useState(initialCustomBody);
  const [customSaved, setCustomSaved] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [isPendingCustom, startCustom] = useTransition();

  function handleAbout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAboutSaved(false); setAboutError(null);
    const fd = new FormData(e.currentTarget);
    const body = (fd.get('aboutBody') as string) ?? aboutBody;
    startAbout(async () => {
      const res = await saveAboutContent(aboutTitle, body);
      if (res.error) { setAboutError(res.error); return; }
      setAboutSaved(true);
    });
  }

  function handleCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCustomSaved(false); setCustomError(null);
    const fd = new FormData(e.currentTarget);
    const body = (fd.get('customBody') as string) ?? customBody;
    startCustom(async () => {
      const res = await saveCustomContent(customTitle, body);
      if (res.error) { setCustomError(res.error); return; }
      setCustomSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      {/* About page */}
      <Section title="About page" hint="Shown at /about on your storefront">
        <form onSubmit={handleAbout} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Page title</label>
            <input
              type="text" value={aboutTitle} onChange={e => setAboutTitle(e.target.value)}
              placeholder="Our Story" maxLength={120}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Body text</label>
            <MarkdownEditor
              name="aboutBody"
              defaultValue={aboutBody}
              placeholder="Tell your story — who you are, how you make things, what drives you…"
              rows={6}
            />
            <p className="text-xs text-stone-400 mt-1">{aboutBody.length} / 3000</p>
          </div>
          {initialAboutImage && (
            <div>
              <p className="text-xs font-medium text-stone-500 mb-1.5">About image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initialAboutImage} alt="About" className="h-20 w-auto rounded-lg object-cover border border-stone-100" />
              <p className="text-xs text-stone-400 mt-1">Change image in <a href="/settings" className="underline hover:text-stone-700">Settings → About image</a></p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isPendingAbout} className={btnCls}>
              {isPendingAbout ? 'Saving…' : 'Save'}
            </button>
            {aboutSaved && <span className="text-sm text-emerald-600">Saved ✓</span>}
            {aboutError && <span className="text-sm text-red-600">{aboutError}</span>}
          </div>
        </form>
      </Section>

      {/* Gallery */}
      <Section title="Gallery page" hint="Shown at /gallery — images managed in the Gallery section">
        <p className="text-sm text-stone-500">
          Gallery images are managed in the{' '}
          <a href="/gallery" className="text-[#c96a3a] hover:underline">Gallery</a>{' '}
          section. Upload or reorder images there — they appear automatically on the gallery page.
        </p>
      </Section>

      {/* Custom orders page */}
      <Section title="Custom orders page" hint="Shown at /custom — for bespoke enquiries">
        <form onSubmit={handleCustom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Page title</label>
            <input
              type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)}
              placeholder="Custom Orders" maxLength={120}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
            <MarkdownEditor
              name="customBody"
              defaultValue={customBody}
              placeholder="Describe how customers can enquire about bespoke or custom pieces…"
              rows={5}
            />
          </div>
          {whatsapp && (
            <p className="text-xs text-stone-400">
              CTA button links to your WhatsApp ({whatsapp}). Change in{' '}
              <a href="/settings" className="underline hover:text-stone-700">Settings → Contact</a>.
            </p>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isPendingCustom} className={btnCls}>
              {isPendingCustom ? 'Saving…' : 'Save'}
            </button>
            {customSaved && <span className="text-sm text-emerald-600">Saved ✓</span>}
            {customError && <span className="text-sm text-red-600">{customError}</span>}
          </div>
        </form>
      </Section>
    </div>
  );
}
