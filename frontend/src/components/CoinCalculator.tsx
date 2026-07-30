'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import {
  discountPct,
  LOOTBAR_TIERS,
  usdToGbpPence,
} from '@/lib/pricing';
import {
  formatCoins,
  formatGbp,
  type Platform,
  type Product,
} from '@/lib/site';

const PLATS: { id: Platform; key: 'ps' | 'xbox' | 'pc'; label: string; icon: string; ico: string }[] = [
  { id: 'ps4_ps5', key: 'ps', label: 'PSN', icon: '/brand/Logo-da-psn-1.png', ico: 'ico-ps' },
  { id: 'xbox', key: 'xbox', label: 'Xbox', icon: '/brand/xbox-1.png', ico: 'ico-xbox' },
  { id: 'pc', key: 'pc', label: 'PC', icon: '/brand/PC-1.png', ico: 'ico-pc' },
];

function findProduct(products: Product[], coins: number) {
  return products.find((p) => p.coin_amount === coins) ?? null;
}

function syntheticProduct(platform: Platform, coins: number, bonus: number, price: number, compare: number): Product {
  const tier = LOOTBAR_TIERS.find((t) => t.coins === coins);
  return {
    id: `lootbar-${platform}-${coins}`,
    slug: `lootbar-${platform}-${coins}`,
    name: `${tier?.label ?? formatCoins(coins)} Safe Coins`,
    description: 'EA FC 26 coins — LootBar reference pricing',
    coin_amount: coins,
    bonus_coins: bonus,
    price_gbp_pence: price,
    compare_at_gbp_pence: compare,
    platform,
    is_active: true,
    sort_order: coins,
    image_url: null,
  };
}

export function CoinCalculator() {
  const { platform, setPlatform, addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .products(platform)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  const tiers = useMemo(() => {
    return LOOTBAR_TIERS.map((tier) => {
      const fromApi = findProduct(products, tier.coins);
      const sale = fromApi?.price_gbp_pence ?? usdToGbpPence(tier.usdSale);
      const list =
        fromApi?.compare_at_gbp_pence ?? usdToGbpPence(tier.usdList);
      return {
        ...tier,
        product:
          fromApi ??
          syntheticProduct(platform, tier.coins, tier.bonus, sale, list),
        sale,
        list,
        off: discountPct(sale, list),
      };
    });
  }, [products, platform]);

  const active = tiers[Math.min(index, tiers.length - 1)] ?? tiers[0];
  const fillPct = tiers.length > 1 ? (index / (tiers.length - 1)) * 100 : 0;
  const platMeta = PLATS.find((p) => p.id === platform) ?? PLATS[0];
  const installment = active.sale / 12;

  const selectPlat = (id: Platform) => {
    setPlatform(id);
    setIndex(0);
  };

  const bump = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(tiers.length - 1, i + delta)));
  };

  return (
    <div id="fce-calc">
      <div className="step-head">
        <div className="step-head-l">
          <div className="step-num">01</div>
          <div className="step-title">Choose your platform</div>
        </div>
      </div>

      <div className="plats" id="fce-plats">
        {PLATS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`plat ${platform === p.id ? 'active' : ''}`}
            onClick={() => selectPlat(p.id)}
          >
            <div className="plat-ic">
              <Image
                src={p.icon}
                alt={p.label}
                width={44}
                height={44}
                className={p.ico}
              />
            </div>
            <div className="plat-name">{p.label}</div>
          </button>
        ))}
      </div>

      <div className="step-head">
        <div className="step-head-l">
          <div className="step-num">02</div>
          <div className="step-title">
            Choose FC 26 coin amount
          </div>
        </div>
      </div>

      <div className="calc-body">
        <div className="coins-top">
          <div className="coins-plat-ic">
            <Image
              src={platMeta.icon}
              alt=""
              width={38}
              height={38}
              className={platMeta.ico}
            />
          </div>
          <div className="coins-amount">
            <div className="ut-coin">
              <Image src="/brand/svgexport-1-1.png" alt="" width={38} height={38} />
            </div>
            <div className="coins-num gold-txt">{active.label}</div>
          </div>
        </div>

        <div className="slider-wrap">
          <div className="slider-fill" style={{ width: `${fillPct}%` }} />
          <input
            className="slider"
            type="range"
            min={0}
            max={tiers.length - 1}
            step={1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            aria-label="Coin amount"
          />
          <div className="ticks">
            {tiers.map((t, i) => {
              const major = ['100K', '500K', '1M', '5M', '10M', '30M'].includes(
                t.label,
              );
              return (
                <button
                  key={t.label}
                  type="button"
                  className={`tick ${i === index ? 'on' : ''}`}
                  onClick={() => setIndex(i)}
                >
                  {major || i === index ? t.label : '·'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="qty-block">
          <div className="qty-label">Coin amount</div>
          <div className="qty-ctrl">
            <button type="button" className="qbtn" onClick={() => bump(-1)}>
              −
            </button>
            <div className="qty-display">
              <div className="ut-coin">
                <Image src="/brand/svgexport-1-1.png" alt="" width={30} height={30} />
              </div>
              <div className="qty-value">
                {active.coins.toLocaleString('en-GB')}
              </div>
            </div>
            <button type="button" className="qbtn" onClick={() => bump(1)}>
              +
            </button>
          </div>
        </div>

        <div className="price-block">
          <div className="price-row">
            <span className="price-old">{formatGbp(active.list)}</span>
            <span className="price-now gold-txt">{formatGbp(active.sale)}</span>
            {active.off > 0 && (
              <span className="price-off">Down {active.off}%</span>
            )}
          </div>
          <p className="price-installment" id="fce-installment">
            or 12 interest-free payments of {formatGbp(Math.round(installment))}
          </p>
          <button
            type="button"
            className="buy-btn"
            disabled={loading}
            onClick={() => addItem(active.product)}
          >
            Buy now
          </button>
          <div className="secure">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
            100% secure payment · Instant delivery
          </div>
        </div>
      </div>

      <div className="pacotes-title gold-txt">Coin packs</div>
      <div className="table" id="fce-table">
        {tiers.map((t) => (
          <div key={t.label} className="trow">
            <div className="tcell-left">
              <div className="tplat-ic">
                <Image
                  src={platMeta.icon}
                  alt=""
                  width={28}
                  height={28}
                  className={platMeta.ico}
                />
              </div>
              <div className="tqty">{t.label}</div>
            </div>
            <div className="tcell-price">
              <span className="tprice-old">{formatGbp(t.list)}</span>
              <span className="tprice-now">{formatGbp(t.sale)}</span>
              {t.off > 0 && <span className="tprice-off">Down {t.off}%</span>}
            </div>
            <button
              type="button"
              className="tbuy"
              onClick={() => addItem(t.product)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
