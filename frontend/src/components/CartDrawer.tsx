'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatCoins, formatGbp } from '@/lib/site';

const PLAT_ICON: Record<string, string> = {
  ps4_ps5: '/brand/Logo-da-psn-1.png',
  xbox: '/brand/xbox-1.png',
  pc: '/brand/PC-1.png',
};

export function CartDrawer() {
  const {
    items,
    count,
    totalPence,
    totalCoins,
    drawerOpen,
    setDrawerOpen,
    setItemQuantity,
    removeItem,
  } = useCart();

  return (
    <>
      <div
        id="fce-ov"
        className={drawerOpen ? 'open' : ''}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside
        id="fce-dr"
        className={drawerOpen ? 'open' : ''}
        aria-hidden={!drawerOpen}
      >
        <div className="fce-dh">
          <h3>Your cart ({count})</h3>
          <button
            type="button"
            className="fce-dx"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="fce-db">
          {items.length === 0 ? (
            <div className="fce-empty">
              <div className="fce-empty-ic">🛒</div>
              <div className="fce-empty-t">Cart is empty</div>
              <p>Choose your coins and click Buy</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="fce-ci">
                <div className="fce-ci-top">
                  <div className="fce-ci-left">
                    <div className="fce-ci-ico">
                      <Image
                        src={PLAT_ICON[item.product.platform] ?? '/brand/svgexport-1-1.png'}
                        alt=""
                        width={28}
                        height={28}
                      />
                    </div>
                    <div>
                      <div className="fce-ci-name">{formatCoins(item.product.coin_amount)}</div>
                      <div className="fce-ci-label">{item.product.name}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="fce-ci-rm"
                    onClick={() => removeItem(item.product.id)}
                    aria-label="Remove"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M4 7h16" />
                      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      <path d="M6.5 7 7.5 19a2 2 0 0 0 2 1.7h5a2 2 0 0 0 2-1.7L18.5 7" />
                      <path d="M10 11v5M14 11v5" />
                    </svg>
                  </button>
                </div>
                <div className="fce-qty">
                  <button
                    type="button"
                    className="fce-qb"
                    onClick={() =>
                      setItemQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <div className="fce-qval">
                    <Image
                      src="/brand/svgexport-1-1.png"
                      alt=""
                      width={24}
                      height={24}
                    />
                    <span>{item.quantity}</span>
                  </div>
                  <button
                    type="button"
                    className="fce-qb"
                    onClick={() =>
                      setItemQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <div className="fce-ci-price">
                  {formatGbp(item.product.price_gbp_pence * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fce-df">
          <div className="fce-df-row">
            <span className="fce-df-lbl">Total coins</span>
            <span className="fce-df-val">{formatCoins(totalCoins)}</span>
          </div>
          <div className="fce-df-row fce-df-total">
            <span className="fce-df-lbl">Total (GBP)</span>
            <span className="fce-df-val">{formatGbp(totalPence)}</span>
          </div>
          <button
            type="button"
            className="fce-btn-cont"
            onClick={() => setDrawerOpen(false)}
          >
            Continue shopping
          </button>
          <Link href="/checkout" className="fce-btn-pay" onClick={() => setDrawerOpen(false)}>
            Go to checkout
          </Link>
        </div>
      </aside>
    </>
  );
}
