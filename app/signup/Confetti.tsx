'use client';

/**
 * Lightweight, dependency-free confetti burst — a handful of absolutely
 * positioned pieces that fall + spin via the `confettiFall` keyframe in
 * globals.css, then unmount themselves. No canvas, no external package
 * (keeps this a small storefront app, not a platform with a confetti lib).
 *
 * Usage: mount with a fresh `key` each time you want a burst (e.g.
 * `<Confetti key={burstId} colors={palette} count={40} />`) — remounting is
 * what re-triggers the CSS animation.
 */
export function Confetti({ colors, count = 28 }: { colors: string[]; count?: number }) {
  const palette = colors.length ? colors : ['#c96a3a', '#f5845a', '#2d2117'];
  const pieces = Array.from({ length: count }, (_, i) => {
    const color = palette[i % palette.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.25;
    const duration = 1.4 + Math.random() * 1;
    const size = 5 + Math.random() * 5;
    const rounded = i % 3 === 0;
    return { id: i, color, left, delay, duration, size, rounded };
  });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible z-50" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * (p.rounded ? 1 : 0.5),
            background: p.color,
            borderRadius: p.rounded ? '50%' : 2,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
