/**
 * Miniature "browser mockup" preview for each storefront template — a scaled
 * port of the CSS mockups on the marketing site (store-marketting/index.html,
 * .tcard-preview blocks) so the signup picker and the public showcase look
 * consistent. Also doubles as the bigger "live preview" panel (`size="lg"`)
 * with the store name typeset into the hero instead of a placeholder bar.
 *
 * A template can override this entirely with a real screenshot — see
 * `imageUrl` handling in page.tsx — same fallback rule as the marketing site
 * ("empty/missing imageUrl = keep the CSS mockup").
 */
import type { CSSProperties } from 'react';

type NavStyle = 'default' | 'folio' | 'capsule';

type TemplateLook = {
  pageBg: string;
  nav: {
    bg: string;
    borderBottom?: string;
    dotColor: string;
    pillColor: string;
    pillOpacity?: number;
    style?: NavStyle;
  };
  hero: {
    bg: string;
    titleColor: string;
    titleOpacity?: number;
    titleBarHeight?: number; // px at "sm" scale — folio's is taller
    ctaColor: string;
    ctaOpacity?: number;
    image?: { bg: string; radius: number; opacity?: number; border?: string };
  };
  grid: {
    cols: number;
    cellRadius: number;
    cellColors: string[];
    cellBorderAlt?: [string, string]; // neon: alternating cyan/violet borders
    noTopPad?: boolean; // folio's grid sits flush under the hero
  };
};

const LOOKS: Record<string, TemplateLook> = {
  soulthread: {
    pageBg: '#faf8f5',
    nav: { bg: '#faf8f5', borderBottom: '#e8e0d5', dotColor: '#c96a3a', pillColor: '#c96a3a', pillOpacity: 0.8 },
    hero: {
      bg: 'linear-gradient(135deg,#faf8f5,#f0ebe3)', titleColor: '#c96a3a', titleOpacity: 0.7, ctaColor: '#c96a3a',
      image: { bg: 'linear-gradient(135deg,#c96a3a,#8b4513)', radius: 4 },
    },
    grid: { cols: 3, cellRadius: 3, cellColors: ['#f0ebe3', '#e8ddd0', '#f0ebe3'] },
  },
  aurora: {
    pageBg: '#fff',
    nav: { bg: '#fff', borderBottom: '#f4f4f5', dotColor: '#18181b', pillColor: '#18181b' },
    hero: { bg: '#f4f4f5', titleColor: '#18181b', ctaColor: '#18181b', image: { bg: '#e4e4e7', radius: 3 } },
    grid: { cols: 4, cellRadius: 2, cellColors: ['#f4f4f5', '#e4e4e7', '#f4f4f5', '#e4e4e7'] },
  },
  bloom: {
    pageBg: '#f7f4ef',
    nav: { bg: '#f7f4ef', borderBottom: '#e8e0d0', dotColor: '#5a7d5a', pillColor: '#5a7d5a' },
    hero: {
      bg: 'linear-gradient(135deg,#f7f4ef,#eee8dc)', titleColor: '#2d3a2d', ctaColor: '#c4835a',
      image: { bg: 'linear-gradient(135deg,#5a7d5a,#c4835a)', radius: 4, opacity: 0.7 },
    },
    grid: { cols: 3, cellRadius: 3, cellColors: ['#dde8dd', '#e8ddd5', '#dde8dd'] },
  },
  coastal: {
    pageBg: '#f5f0e8',
    nav: { bg: '#1a3040', dotColor: '#fff', pillColor: '#2d7d9a', pillOpacity: 1 },
    hero: {
      bg: 'linear-gradient(135deg,#1a3040,#2d7d9a)', titleColor: '#fff', titleOpacity: 0.85, ctaColor: '#c49a6c',
      image: { bg: 'rgba(255,255,255,0.12)', radius: 4, border: '1px solid rgba(255,255,255,0.18)' },
    },
    grid: { cols: 4, cellRadius: 2, cellColors: ['#e8e0d0', '#d8d0c0', '#e8e0d0', '#d8d0c0'] },
  },
  neon: {
    pageBg: '#0a0a0b',
    nav: { bg: '#0f0f10', borderBottom: 'rgba(0,229,255,0.1)', dotColor: '#00e5ff', pillColor: '#7c3aff' },
    hero: {
      bg: 'linear-gradient(135deg,#0a0a0b,#1a0a2e)', titleColor: '#00e5ff', titleOpacity: 0.8, ctaColor: '#7c3aff',
      image: { bg: 'linear-gradient(135deg,#7c3aff,#00e5ff)', radius: 4, opacity: 0.35 },
    },
    grid: {
      cols: 4, cellRadius: 2, cellColors: ['#1a1a1c', '#1a1a1c', '#1a1a1c', '#1a1a1c'],
      cellBorderAlt: ['1px solid rgba(0,229,255,0.14)', '1px solid rgba(124,58,255,0.14)'],
    },
  },
  bubbly: {
    pageBg: '#fff8f3',
    nav: { bg: '#fff8f3', borderBottom: '#ffe4d6', dotColor: '#ff4d6d', pillColor: '#ff4d6d' },
    hero: {
      bg: 'linear-gradient(135deg,#fff8f3,#fff0e8)', titleColor: '#1a0a00', ctaColor: '#ff4d6d',
      image: { bg: 'linear-gradient(135deg,#ff4d6d,#ffd60a)', radius: 7, opacity: 0.5 },
    },
    grid: { cols: 3, cellRadius: 4, cellColors: ['#ffe4ee', '#fff3b0', '#ffe4ee'] },
  },
  folio: {
    pageBg: '#fff',
    nav: { bg: '#fff', borderBottom: '#f0f0f0', dotColor: '#111', pillColor: '#111', style: 'folio' },
    hero: { bg: '#fff', titleColor: '#111', titleBarHeight: 8, ctaColor: '#e05c2a' },
    grid: { cols: 3, cellRadius: 0, cellColors: ['#f4f4f4', '#e8e8e8', '#f4f4f4'], noTopPad: true },
  },
  profile: {
    pageBg: '#f8f7f5',
    nav: { bg: '#1e3a5f', dotColor: '#c9a227', pillColor: '#c9a227' },
    hero: { bg: 'linear-gradient(135deg,#1e3a5f,#2d5282)', titleColor: '#fff', titleOpacity: 0.9, ctaColor: '#c9a227' },
    grid: { cols: 3, cellRadius: 3, cellColors: ['#e8e4dc', '#ddd8cc', '#e8e4dc'] },
  },
  artisan: {
    pageBg: '#fdf8f0',
    nav: { bg: 'rgba(253,248,240,0.95)', borderBottom: '#e8dece', dotColor: '#b5651d', pillColor: '#b5651d' },
    hero: {
      bg: 'linear-gradient(135deg,#1a0d06,#3d1f0a)', titleColor: '#fdf8f0', titleOpacity: 0.8, ctaColor: '#d4a84b',
      image: { bg: 'linear-gradient(135deg,#d4a84b,#b5651d)', radius: 4, opacity: 0.5 },
    },
    grid: { cols: 3, cellRadius: 3, cellColors: ['#ede0cc', '#e4d4b8', '#ede0cc'] },
  },
  capsule: {
    pageBg: '#fce8ef',
    nav: { bg: '#fce8ef', borderBottom: '#f5c6d0', dotColor: '#c94070', pillColor: '#c94070', style: 'capsule' },
    hero: {
      bg: 'linear-gradient(135deg,#fce8ef,#f9d0db)', titleColor: '#c94070', titleOpacity: 0.8, ctaColor: '#c94070',
      image: { bg: 'linear-gradient(135deg,#c94070,#f9d0db)', radius: 6, opacity: 0.6 },
    },
    grid: { cols: 3, cellRadius: 5, cellColors: ['#f5c6d0', '#fde8ef', '#f5c6d0'] },
  },
};

/** Size tokens — "lg" is roughly 2.7x "sm", tuned for a ~230px-tall live-preview panel. */
const SCALE = {
  sm: { nav: 20, hero: 34, pad: 9, gap: 5, dotW: 12, dotH: 3, pillW: 22, pillH: 7, img: 30, titleBar: 5, gapSm: 3, cta: 7, ctaW: 38, gridGap: 3, gridPad: 5, titleFont: 0 },
  lg: { nav: 52, hero: 92, pad: 22, gap: 13, dotW: 32, dotH: 8, pillW: 58, pillH: 19, img: 78, titleBar: 13, gapSm: 8, cta: 19, ctaW: 100, gridGap: 8, gridPad: 14, titleFont: 17 },
};

export function TemplateMockup({ id, size = 'sm', storeName }: { id: string; size?: 'sm' | 'lg'; storeName?: string }) {
  const look = LOOKS[id] ?? LOOKS.aurora;
  const s = SCALE[size];
  const navRow: CSSProperties = {
    flex: `0 0 ${s.nav}px`, display: 'flex', alignItems: 'center', padding: `0 ${s.pad}px`, gap: s.gap,
    background: look.nav.bg, borderBottom: look.nav.borderBottom ? `1px solid ${look.nav.borderBottom}` : undefined,
  };

  return (
    <div style={{ height: '100%', background: look.pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={navRow}>
        {look.nav.style === 'capsule' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: s.gap * 0.5 }}>
            <div style={{ width: s.dotW * 0.5, height: s.dotW * 0.5, borderRadius: '50%', background: look.nav.dotColor }} />
            <div style={{ width: s.dotW * 0.35, height: s.dotH, borderRadius: 1, background: look.nav.pillColor, opacity: 0.5 }} />
          </div>
        ) : look.nav.style === 'folio' ? (
          <div style={{ width: s.dotW * 1.6, height: s.dotH + 1, background: look.nav.dotColor, borderRadius: 1 }} />
        ) : (
          <div style={{ width: s.dotW, height: s.dotH, background: look.nav.dotColor, borderRadius: 2, opacity: look.nav.style ? 1 : 0.95 }} />
        )}
        <div style={{ flex: 1 }} />
        {look.nav.style === 'folio' ? (
          <>
            <div style={{ width: s.dotH + 2, height: s.dotH + 2, background: look.nav.dotColor, borderRadius: 1 }} />
            <div style={{ width: s.dotH + 2, height: s.dotH + 2, background: look.nav.dotColor, borderRadius: 1 }} />
          </>
        ) : (
          <div style={{ width: s.pillW, height: s.pillH, background: look.nav.pillColor, borderRadius: 3, opacity: look.nav.pillOpacity ?? 1 }} />
        )}
      </div>

      {/* Hero */}
      <div style={{ flex: `0 0 ${s.hero}px`, background: look.hero.bg, display: 'flex', alignItems: 'center', padding: `0 ${s.pad}px`, gap: s.gap }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {storeName ? (
            <div
              style={{
                fontWeight: 700, fontSize: s.titleFont || 9, color: look.hero.titleColor, lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: s.gapSm,
              }}
            >
              {storeName}
            </div>
          ) : (
            <div
              style={{
                height: look.hero.titleBarHeight ?? s.titleBar, background: look.hero.titleColor, borderRadius: 1,
                marginBottom: s.gapSm, width: '72%', opacity: look.hero.titleOpacity ?? 1,
              }}
            />
          )}
          <div style={{ height: s.cta, background: look.hero.ctaColor, borderRadius: 3, width: s.ctaW, opacity: look.hero.ctaOpacity ?? 1 }} />
        </div>
        {look.hero.image && (
          <div
            style={{
              width: s.img, height: s.img, flexShrink: 0, background: look.hero.image.bg,
              borderRadius: look.hero.image.radius * (size === 'lg' ? 2.5 : 1),
              opacity: look.hero.image.opacity ?? 1, border: look.hero.image.border,
            }}
          />
        )}
      </div>

      {/* Product grid */}
      <div
        style={{
          flex: 1, display: 'grid', gridTemplateColumns: `repeat(${look.grid.cols},1fr)`, gap: s.gridGap,
          padding: `${look.grid.noTopPad ? 0 : s.gridPad}px ${s.pad}px ${s.gridPad}px`,
        }}
      >
        {look.grid.cellColors.map((c, i) => (
          <div
            key={i}
            style={{
              borderRadius: look.grid.cellRadius * (size === 'lg' ? 2.5 : 1),
              background: c,
              border: look.grid.cellBorderAlt ? look.grid.cellBorderAlt[i % 2] : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** One-word mood badges shown in the corner of the preview — matches the marketing site showcase. */
export const BADGE_WORDS: Record<string, string> = {
  soulthread: 'Artisan',
  aurora: 'Minimal',
  bloom: 'Botanical',
  coastal: 'Ocean',
  neon: 'Dark',
  bubbly: 'Playful',
  folio: 'Portfolio',
  profile: 'Business',
  artisan: 'Handicraft',
  capsule: 'Fashion',
};
