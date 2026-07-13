import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Faceted W mark — vector replacement for `washhouse-icon.png` in navbar/mobile.
 * Colors align with brand tokens (`--brand-700`, `--brand-500`, `--sky-500`, `--sky-400`).
 * Regenerate source SVG: `python scripts/build-icon-svg.py`
 */
const FACETS: ReadonlyArray<{ d: string; fill: string; transform: string }> = [
  {
    d: 'M0,0 L3,1 L17,26 L33,53 L38,63 L27,79 L19,90 L17,90 L1,64 L-1,61 L-11,74 L-22,90 L-33,106 L-56,122 L-67,130 L-71,129 L-74,124 L-72,119 L-55,91 L-40,66 L-26,43 L-17,28 L-4,7 Z',
    fill: '#06b6d4',
    transform: 'translate(131,13)',
  },
  {
    d: 'M0,0 L11,0 L10,4 L2,18 L-8,35 L-16,49 L-24,62 L-37,84 L-53,111 L-69,138 L-76,150 L-79,149 L-92,127 L-108,100 L-110,97 L-109,92 L-99,78 L-95,73 L-89,81 L-78,98 L-73,94 L-64,82 L-53,68 L-46,59 L-35,45 L-25,32 L-15,19 L-4,5 Z',
    fill: '#0891b2',
    transform: 'translate(244,44)',
  },
  {
    d: 'M0,0 L3,1 L17,25 L18,29 L8,44 L0,56 L-10,71 L-27,97 L-36,110 L-39,109 L-56,80 L-62,70 L-67,72 L-87,86 L-104,98 L-108,101 L-110,101 L-108,96 L-95,73 L-82,51 L-78,44 L-75,45 L-74,50 L-88,74 L-91,80 L-75,69 L-67,63 L-64,64 L-62,67 L-49,57 L-35,47 L-28,42 L-15,22 Z M-92,80 Z',
    fill: '#2563eb',
    transform: 'translate(128,83)',
  },
  {
    d: 'M0,0 L53,0 L61,13 L75,38 L74,43 L59,67 L49,83 L47,84 L31,56 L16,30 L1,4 Z',
    fill: '#1e3a8a',
    transform: 'translate(5,43)',
  },
  {
    d: 'M0,0 L30,0 L29,4 L20,15 L7,31 L-4,45 L-13,56 L-26,72 L-37,86 L-41,88 L-54,70 L-56,65 L-45,50 L-38,40 L-33,38 L-20,23 L-9,10 L-2,1 Z',
    fill: '#06b6d4',
    transform: 'translate(207,44)',
  },
  {
    d: 'M0,0 L3,1 L-11,25 L-18,35 L-22,36 L-24,35 L-22,29 L-15,17 L-13,14 L-33,22 L-59,33 L-75,40 L-77,40 L-79,45 L-87,56 L-94,67 L-98,63 L-94,55 L-81,36 L-75,32 L-51,22 L-39,17 L-14,6 Z',
    fill: '#22d3ee',
    transform: 'translate(265,6)',
  },
  {
    d: 'M0,0 L3,1 L4,6 L-10,30 L-13,36 L3,25 L11,19 L14,20 L15,24 L11,28 L-9,42 L-26,54 L-30,57 L-32,57 L-30,52 L-17,29 L-4,7 Z M-14,36 Z',
    fill: '#1d4ed8',
    transform: 'translate(50,127)',
  },
];

export type WashhouseIconMarkProps = SVGProps<SVGSVGElement>;

export function WashhouseIconMark({ className, ...props }: WashhouseIconMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 270 197"
      fill="none"
      className={cn('block h-full w-auto shrink-0', className)}
      {...props}
    >
      {FACETS.map((facet) => (
        <path
          key={facet.transform}
          d={facet.d}
          fill={facet.fill}
          transform={facet.transform}
        />
      ))}
    </svg>
  );
}
