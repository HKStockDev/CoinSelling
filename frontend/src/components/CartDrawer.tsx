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
                      width="17"
                      height="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
                      <path d="M19 6v13.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5V6" />
                      <path d="M10 11v6M14 11v6" />
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
