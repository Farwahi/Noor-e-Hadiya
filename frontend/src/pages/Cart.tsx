import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CartItem, DonationItem } from "../types";
import { clearCart, getCart, onCartChange } from "../cart";

function isDonationItem(it: CartItem): it is DonationItem {
  return (it as any).isDonation === true;
}

// ✅ Universal getters so totals never become 0 by mistake
// Works with:
// - Services: priceGBP / priceUSD / pricePKR
// - Donations: donationGBP / donationUSD / donationPKR
// - Zakat items (your calculator): priceGBP / priceUSD / pricePKR (+ price/pkr fallback)
function getGBP(it: CartItem): number {
  const anyIt: any = it;
  if (isDonationItem(it)) {
    return Number(anyIt.donationGBP ?? anyIt.priceGBP ?? anyIt.price ?? 0) || 0;
  }
  return Number(anyIt.priceGBP ?? anyIt.price ?? 0) || 0;
}

function getUSD(it: CartItem): number {
  const anyIt: any = it;
  if (isDonationItem(it)) {
    return Number(anyIt.donationUSD ?? anyIt.priceUSD ?? anyIt.price ?? 0) || 0;
  }
  return Number(anyIt.priceUSD ?? anyIt.price ?? 0) || 0;
}

function getPKR(it: CartItem): number {
  const anyIt: any = it;
  if (isDonationItem(it)) {
    return (
      Number(anyIt.donationPKR ?? anyIt.pricePKR ?? anyIt.pkr ?? anyIt.price ?? 0) || 0
    );
  }
  return Number(anyIt.pricePKR ?? anyIt.pkr ?? anyIt.price ?? 0) || 0;
}

function moneyLabel(it: CartItem) {
  if (!isDonationItem(it)) return null;

  const gbp = getGBP(it);
  const usd = getUSD(it);
  const pkr = getPKR(it);

  if (gbp > 0) return `£${gbp.toFixed(2)}`;
  if (usd > 0) return `$${usd.toFixed(2)}`;
  if (pkr > 0) return `PKR ${Math.round(pkr).toLocaleString()}`;
  return null;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => getCart());

  useEffect(() => {
    const unsub = onCartChange(() => setItems(getCart()));
    return unsub;
  }, []);

  const totalGBP = useMemo(
    () => items.reduce((sum, it) => sum + getGBP(it), 0),
    [items]
  );
  const totalUSD = useMemo(
    () => items.reduce((sum, it) => sum + getUSD(it), 0),
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
            maxWidth: 1000,
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
              <h1 className="page-heading" style={{ margin: 0 }}>
                Cart
              </h1>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Review your selected services and proceed to checkout.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {items.length > 0 && (
                <button
                  className="btn"
                  onClick={clearCart}
                  style={{ width: "auto", marginTop: 0 }}
                >
                  Clear Cart
                </button>
              )}

              <Link
                to="/services"
                className="btn"
                style={{ width: "auto", marginTop: 0 }}
              >
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
                  const isDonation = isDonationItem(it);

                  const label = isDonation
                    ? "Custom Request"
                    : (it as any).countLabel
                    ? (it as any).countLabel
                    : "";

                  const amountText = isDonation ? moneyLabel(it) : null;

                  return (
                    <li key={`${it.id}-${idx}`} style={{ marginBottom: 12 }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{it.name}</span>{" "}
                        {label ? (
                          <span className="muted">({label})</span>
                        ) : null}

                        {isDonation ? (
                          <span className="muted" style={{ marginLeft: 8 }}>
                            • Additional
                          </span>
                        ) : null}

                        {amountText ? (
                          <span className="muted" style={{ marginLeft: 8 }}>
                            • {amountText}
                          </span>
                        ) : null}
                      </div>

                      {/* Extra info for donation items */}
                      {isDonation ? (
                        <div className="muted" style={{ marginTop: 4 }}>
                          {(it as DonationItem).location ? (
                            <div>Location: {(it as DonationItem).location}</div>
                          ) : null}
                          {(it as DonationItem).notes ? (
                            <div>Notes: {(it as DonationItem).notes}</div>
                          ) : null}
                        </div>
                      ) : null}
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
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
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
                  <span className="muted">Total (USD)</span>
                  <b>${totalUSD.toFixed(2)}</b>
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
