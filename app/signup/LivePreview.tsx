'use client';
import { TemplateMockup, BADGE_WORDS } from './TemplateMockup';
import type { SignupTemplate } from './actions';

/**
 * The "watch your store come alive" panel next to the wizard — a fake browser
 * window rendering the selected template's mockup with the store name
 * typeset into the hero and the chosen slug in the URL bar. Purely for
 * delight/orientation; nothing here is submitted, it just mirrors form state.
 */
export function LivePreview({
  storeName, slug, platformDomain, template,
}: {
  storeName: string; slug: string; platformDomain: string; template: SignupTemplate;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden animate-[fadeSlideIn_0.4s_ease]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-stone-100 border-b border-stone-200 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        </div>
        <div className="flex-1 min-w-0 mx-2 rounded-md bg-white border border-stone-200 px-2.5 py-1 text-[11px] text-stone-500 truncate text-center">
          {slug || 'your-store'}.{platformDomain}
        </div>
      </div>

      {/* Rendered mockup */}
      <div className="relative h-[230px]">
        {template.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.imageUrl} alt={template.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <TemplateMockup id={template.id} size="lg" storeName={storeName.trim()} />
        )}
        {BADGE_WORDS[template.id] && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {BADGE_WORDS[template.id]}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 py-3 border-t border-stone-100">
        <p className="text-xs text-stone-500">
          <span className="font-semibold text-stone-800">{template.name}</span> template · this updates live as you type ✨
        </p>
      </div>
    </div>
  );
}
