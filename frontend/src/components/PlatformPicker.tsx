'use client';

import { PLATFORMS, type Platform } from '@/lib/site';
import { useCart } from '@/lib/cart';

export function PlatformPicker() {
  const { platform, setPlatform } = useCart();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Platform">
      {PLATFORMS.map((p) => {
        const active = platform === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setPlatform(p.id as Platform)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'bg-pitch text-cream'
                : 'border border-pitch/20 bg-white/60 text-pitch hover:border-gold'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
