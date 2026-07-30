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
            className={`rounded-xl px-4 py-2 font-display text-sm uppercase tracking-wide transition ${
              active
                ? 'border-2 border-gold bg-gold/10 text-gold'
                : 'border border-white/10 bg-white/5 text-white/70 hover:border-gold/40'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
