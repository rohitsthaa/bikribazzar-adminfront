/**
 * BikriBazaar logo mark — the orange B letterform with integrated shopping bag.
 * `bg` must match the surface it sits on (upper bowl cutout + bag handle stroke).
 */
export function BikriMark({ bg = '#ffffff', size = 32 }: { bg?: string; size?: number }) {
  return (
    <svg
      width={Math.round(size * 0.8)}
      height={size}
      viewBox="4 4 88 112"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BikriBazaar"
    >
      <path fill="#F05228" d="M 8,8 L 8,104 L 48,104 C 70,104 78,94 78,82 C 78,70 70,62 58,59 C 68,56 74,48 74,36 C 74,20 64,8 44,8 Z"/>
      <path fill={bg} d="M 24,22 L 42,22 C 56,22 58,30 58,36 C 58,46 52,50 40,50 L 24,50 Z"/>
      <path fill="#F5845A" d="M 26,64 L 26,92 Q 26,100 34,100 L 60,100 Q 70,100 70,90 L 70,72 Q 70,64 60,64 L 34,64 Q 26,64 26,64 Z"/>
      <path fill="none" stroke={bg} strokeWidth="5" strokeLinecap="round" d="M 36,64 C 36,52 62,52 62,64"/>
    </svg>
  );
}
