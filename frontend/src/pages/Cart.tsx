import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Service } from "../types";
import { clearCart, getCart, onCartChange } from "../cart";

/**
 * Cart can contain:
 * - normal Service items (priceGBP/pricePKR)
 * - donation items with isDonation flag
 */
type CartItem = Service & {
  price?: number;
  pkr?: number;
  isDonation?: boolean;
  count?: string;
};

function getGBP(item: CartItem): number {
  const val = Number(item.priceGBP ?? item.price ?? 0);
  return Number.isFinite(val) ? val : 0;
}

function getPKR(item: CartItem): number {
  const val = Number(item.pricePKR ?? item.pkr ?? 0);
  return Number.isFinite(val) ? val : 0;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => getCart() as CartItem[]);

  useEffect(() => {
    const unsub = onCartChange(() => setItems(getCart() as CartItem[]));
    return unsub;
  }, []);

  const totalGBP = useMemo(
    () => items.reduce((sum, it) => sum + getGBP(it), 0),
    [items]
  );
  const totalPKR = useMemo(
    () => items.reduce((sum, it) => sum + getPKR(it), 0),
    [items]
  );

  return (
    <div className="page">
      <div className="page-inner">
        <div
          className="card"
          style={{
            marginTop: 18,
            maxWidth: 1000,          // 👈 RIGHT & LEFT SPACE CONTROL
            marginLeft: "auto",
            marginRight: "auto",
            padding: "18px 32px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 className="page-heading">Cart</h1>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Review your selected services and proceed to checkout.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {items.length > 0 && (
                <button
                  className="btn"
                  onClick={clearCart}
                  style={{ width: "auto", marginTop: 0 }}
                >
                  Clear Cart
                </button>
              )}

              <Link to="/services" className="btn" style={{ width: "auto", marginTop: 0 }}>
                Add More
              </Link>
            </div>
          </div>

          <hr style={{ opacity: 0.15, margin: "16px 0" }} />

          {/* Empty Cart */}
          {items.length === 0 ? (
            <div>
              <p className="muted" style={{ marginBottom: 22 }}>
                Your cart is empty.
              </p>

              <Link
                to="/services"
                className="btn btn-primary"
                style={{ width: "auto" }}
              >
                Go to Services
              </Link>
            </div>
          ) : (
            <>
              {/* Items */}
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.map((it, idx) => {
                  const key = `${it.id || it.name}-${idx}`;
                  const label =
                    it.countLabel ?? it.count ?? (it.isDonation ? "Donation" : "");

                  return (
                    <li key={key} style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 700 }}>{it.name}</span>{" "}
                      {label && <span className="muted">({label})</span>}
                      {it.isDonation && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          • Sadaqah
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Totals */}
              <div
                style={{
                  marginTop: 14,
                  borderTop: "1px solid rgba(15,138,95,.15)",
                  paddingTop: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Total (GBP)</span>
                  <b>£{totalGBP.toFixed(2)}</b>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <span className="muted">Total (PKR)</span>
                  <b>PKR {Math.round(totalPKR).toLocaleString()}</b>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Link to="/checkout" className="btn btn-primary">
                    Go to Checkout
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
