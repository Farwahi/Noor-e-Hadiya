import React, { useEffect, useMemo, useState } from "react";
import { getCart, clearCart } from "../cart";
import type { CartItem, PaymentDetailsResponse } from "../types";
import { createCheckoutSession, getPaymentDetails } from "../api";

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>(() => getCart());
  const [data, setData] = useState<PaymentDetailsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currency, setCurrency] = useState<"GBP" | "PKR">("GBP");

  // ✅ Additional Information fields
  const [deceasedName, setDeceasedName] = useState("");
  const [notes, setNotes] = useState("");

  // ✅ Manual payment fields (PKR)
  const [manualMethod, setManualMethod] = useState<
    "EasyPaisa" | "JazzCash" | "UPaisa" | "Bank Transfer"
  >("EasyPaisa");
  const [manualTxnId, setManualTxnId] = useState("");
  const [manualPayerName, setManualPayerName] = useState("");
  const [manualSenderNumber, setManualSenderNumber] = useState("");

  // ✅ Totals (supports Service + DonationItem)
  const totalGBP = useMemo(() => {
    return items.reduce((sum, it: any) => sum + Number(it.priceGBP ?? 0), 0);
  }, [items]);

  const totalPKR = useMemo(() => {
    return items.reduce((sum, it: any) => sum + Number(it.pricePKR ?? 0), 0);
  }, [items]);

  const selectedTotalLabel =
    currency === "GBP" ? `£${totalGBP.toFixed(2)}` : `PKR ${Math.round(totalPKR).toLocaleString()}`;

  // ✅ Description (counts duplicate names)
  const description = useMemo(() => {
    if (items.length === 0) return "Noor-e-Hadiya Order";
    const counts = new Map<string, number>();
    items.forEach((x) => counts.set(x.name, (counts.get(x.name) || 0) + 1));
    return Array.from(counts.entries())
      .map(([n, q]) => `${n} x${q}`)
      .join(", ");
  }, [items]);

  // ✅ Reference ID for manual orders (persist)
  const [referenceId, setReferenceId] = useState<string>(() => {
    const existing = localStorage.getItem("neh_ref");
    if (existing) return existing;
    const dt = new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const ref = `NEH-${y}${m}${d}-${rand}`;
    localStorage.setItem("neh_ref", ref);
    return ref;
  });

  // ✅ WhatsApp (UK number)
  const whatsappNumber = "447551214149"; // no +, no spaces

  const whatsappMessage = useMemo(() => {
    const lines = [
      "Assalamu Alaikum, I have placed an order on Noor-e-Hadiya.",
      `Reference: ${referenceId}`,
      `Selected items: ${description}`,
      `Currency: ${currency}`,
      `Total: ${currency === "GBP" ? `£${totalGBP.toFixed(2)}` : `PKR ${Math.round(totalPKR).toLocaleString()}`}`,
      deceasedName ? `Deceased name: ${deceasedName}` : "",
      notes ? `Notes: ${notes}` : "",
      currency === "PKR" ? `Manual method: ${manualMethod}` : "",
      currency === "PKR" && manualTxnId ? `Transaction ID: ${manualTxnId}` : "",
      currency === "PKR" && manualPayerName ? `Payer name: ${manualPayerName}` : "",
      currency === "PKR" && manualSenderNumber ? `Sender number: ${manualSenderNumber}` : "",
      currency === "PKR" ? "I will send the receipt screenshot now." : "",
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  }, [
    referenceId,
    description,
    currency,
    totalGBP,
    totalPKR,
    deceasedName,
    notes,
    manualMethod,
    manualTxnId,
    manualPayerName,
    manualSenderNumber,
  ]);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ✅ load payment details + handle Stripe success redirect
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const isSuccess = qs.get("success") === "1";

    if (isSuccess) {
      clearCart();
      setItems([]);
      setSuccess(true);

      // reset reference for next order
      localStorage.removeItem("neh_ref");
      const dt = new Date();
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
      const ref = `NEH-${y}${m}${d}-${rand}`;
      localStorage.setItem("neh_ref", ref);
      setReferenceId(ref);
    }

    getPaymentDetails()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function payNowStripe() {
    if (totalGBP <= 0) return;

    try {
      setPaying(true);

      const extra = [
        deceasedName ? `Deceased: ${deceasedName}` : "",
        notes ? `Notes: ${notes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const fullDesc = extra ? `${description} | ${extra}` : description;

      const res = await createCheckoutSession({
        amount: totalGBP,
        currency: "gbp",
        description: fullDesc,
      });

      if (res?.url) window.location.href = res.url;
      else alert("Stripe session failed");
    } catch (e) {
      console.error(e);
      alert("Stripe session failed");
    } finally {
      setPaying(false);
    }
  }

  function copyText(txt: string) {
    if (!txt) return;
    navigator.clipboard?.writeText(txt).catch(() => {});
  }

  function confirmManualPakistan() {
    if (totalPKR <= 0) return;

    if (!manualTxnId.trim()) {
      alert("Please enter Transaction ID to confirm on WhatsApp.");
      return;
    }

    alert("Thanks! Please send your receipt screenshot on WhatsApp for manual verification.");
    window.open(whatsappLink, "_blank");
  }

  if (loading) return <p className="muted" style={{ padding: "18px 16px" }}>Loading…</p>;

  // ✅ Wallet receiver
  const walletName = data?.PK?.accountName || "Noor-e-Hadiya";
  const walletNumber = data?.PK?.accountNumber || "03XX-XXXXXXX";

  // ✅ Bank transfer fields (optional)
  const bankName = (data as any)?.PK?.bank?.bankName || "";
  const bankTitle = (data as any)?.PK?.bank?.accountTitle || "";
  const bankIban = (data as any)?.PK?.bank?.iban || "";
  const bankAccount = (data as any)?.PK?.bank?.accountNumber || "";
  const bankSwift = (data as any)?.PK?.bank?.swift || "";

  return (
    <div className="container checkout-wrap" style={{ maxWidth: 980 }}>
      <div className="checkout-head">
        <div>
          <h1 className="page-heading" style={{ marginBottom: 6 }}>Checkout</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Select currency, then pay online (GBP) or manually (PKR). WhatsApp confirmation is available for help.
          </p>
        </div>
      </div>

      {success && (
        <div
          className="card"
          style={{
            borderColor: "rgba(46, 204, 113, 0.45)",
            background: "rgba(46,204,113,0.08)",
            marginBottom: 14,
          }}
        >
          ✅ <b>Payment successful!</b> Thank you. Your cart has been cleared.
        </div>
      )}

      <div className="checkout-grid">
        {/* LEFT */}
        <div>
          {/* Currency */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: 0 }}>1) Choose Currency</h3>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  GBP shows Stripe checkout. PKR shows manual payment options.
                </p>
              </div>

              <div style={{ minWidth: 260 }}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "GBP" | "PKR")}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(15,138,95,.18)",
                    background: "rgba(15,138,95,.06)",
                    color: "inherit",
                  }}
                >
                  <option value="GBP">GBP (United Kingdom)</option>
                  <option value="PKR">PKR (Pakistan)</option>
                </select>

                <div style={{ marginTop: 10 }}>
                  <span className="muted">Total:</span> <b>{selectedTotalLabel}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Selected items */}
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>2) Selected Items</h3>

            {items.length === 0 ? (
              <p className="muted">No selected items.</p>
            ) : (
              <>
                <ul style={{ marginTop: 10 }}>
                  {items.map((it: any, idx) => (
                    <li key={`${it.id ?? it.name}-${idx}`}>
                      <b>{it.name}</b>{" "}
                      {it.isDonation ? (
                        <span className="muted">(Sadaqah)</span>
                      ) : (
                        <span className="muted">({it.countLabel})</span>
                      )}{" "}
                      — {currency === "GBP" ? `£${Number(it.priceGBP).toFixed(2)}` : `PKR ${Math.round(Number(it.pricePKR)).toLocaleString()}`}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 10 }}>
                  <b>Total:</b> {selectedTotalLabel}{" "}
                  {currency === "GBP" && <span className="muted">(PKR {Math.round(totalPKR).toLocaleString()})</span>}
                  {currency === "PKR" && <span className="muted">( £{totalGBP.toFixed(2)} )</span>}
                </div>
              </>
            )}
          </div>

          {/* Additional info */}
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>3) Additional Information</h3>

            <div className="field">
              <label className="muted">Name of deceased person</label>
              <input
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                placeholder="e.g., Marhoom/Marhooma (Name)"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(15,138,95,.18)",
                  background: "rgba(15,138,95,.06)",
                  color: "inherit",
                }}
              />
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="muted">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special request (optional)"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(15,138,95,.18)",
                  background: "rgba(15,138,95,.06)",
                  color: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <a
                className="btn"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{ width: "auto", marginTop: 0 }}
              >
                WhatsApp us for details
              </a>
              <span className="muted" style={{ alignSelf: "center" }}>
                +44 7551 214149
              </span>
            </div>
          </div>

          {/* Stripe */}
          {currency === "GBP" && (
            <div className="card" style={{ marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>4) Pay Online (GBP)</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Card / Apple Pay / Google Pay (Apple/Google Pay appears automatically when supported).
              </p>

              <button className="btn btn-primary" onClick={payNowStripe} disabled={paying || totalGBP <= 0}>
                {paying ? "Redirecting..." : `Pay £${totalGBP.toFixed(2)} with Stripe`}
              </button>
            </div>
          )}

          {/* Manual */}
          {currency === "PKR" && (
            <div className="card" style={{ marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>4) Manual Payment (PKR)</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Pay via EasyPaisa / JazzCash / UPaisa / Bank Transfer, then confirm on WhatsApp with receipt.
              </p>

              <div style={{ border: "1px solid rgba(15,138,95,.18)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <b>Reference:</b> <span style={{ letterSpacing: 0.4 }}>{referenceId}</span>
                  </div>
                  <button className="btn" type="button" onClick={() => copyText(referenceId)} style={{ width: "auto" }}>
                    Copy Ref
                  </button>
                </div>

                <hr style={{ opacity: 0.15, margin: "14px 0" }} />

                <div className="field">
                  <label className="muted">Choose manual payment method</label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(15,138,95,.18)",
                      background: "rgba(15,138,95,.06)",
                      color: "inherit",
                      maxWidth: 520,
                    }}
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="UPaisa">UPaisa (Optional)</option>
                    <option value="Bank Transfer">Bank Transfer (Optional)</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                  <div>
                    <b>Send PKR:</b> {Math.round(totalPKR).toLocaleString()}
                  </div>
                  <button className="btn" type="button" onClick={() => copyText(String(Math.round(totalPKR)))} style={{ width: "auto" }}>
                    Copy Amount
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  {manualMethod !== "Bank Transfer" ? (
                    <>
                      <div><b>Account Name:</b> {walletName}</div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                        <div><b>Account Number:</b> {walletNumber}</div>
                        <button className="btn" type="button" onClick={() => copyText(walletNumber)} style={{ width: "auto" }}>
                          Copy Number
                        </button>
                      </div>

                      <div className="muted" style={{ marginTop: 8 }}>
                        In payment message/notes, write this reference: <b>{referenceId}</b>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="muted" style={{ marginTop: 8 }}>
                        Use bank transfer details below and include reference: <b>{referenceId}</b>
                      </div>

                      {!!bankName && <div style={{ marginTop: 10 }}><b>Bank Name:</b> {bankName}</div>}
                      {!!bankTitle && <div style={{ marginTop: 10 }}><b>Account Title:</b> {bankTitle}</div>}
                      {!!bankIban && <div style={{ marginTop: 10 }}><b>IBAN:</b> {bankIban}</div>}
                      {!!bankAccount && <div style={{ marginTop: 10 }}><b>Account Number:</b> {bankAccount}</div>}
                      {!!bankSwift && <div style={{ marginTop: 10 }}><b>SWIFT:</b> {bankSwift}</div>}

                      {!bankIban && !bankAccount && (
                        <div className="muted" style={{ marginTop: 10 }}>
                          Bank transfer details are not set yet. Add PK.bank fields in backend payment-details response.
                        </div>
                      )}
                    </>
                  )}
                </div>

                <hr style={{ opacity: 0.15, margin: "14px 0" }} />

                <div className="field">
                  <label className="muted">Transaction ID (required)</label>
                  <input
                    value={manualTxnId}
                    onChange={(e) => setManualTxnId(e.target.value)}
                    placeholder="e.g., EP123456789 / JC123456789"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(15,138,95,.18)",
                      background: "rgba(15,138,95,.06)",
                      color: "inherit",
                    }}
                  />
                  {!manualTxnId.trim() && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      Enter Transaction ID to confirm on WhatsApp.
                    </div>
                  )}
                </div>

                <div className="field-row" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label className="muted">Payer name (optional)</label>
                    <input
                      value={manualPayerName}
                      onChange={(e) => setManualPayerName(e.target.value)}
                      placeholder="Your name"
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(15,138,95,.18)",
                        background: "rgba(15,138,95,.06)",
                        color: "inherit",
                      }}
                    />
                  </div>

                  <div className="field">
                    <label className="muted">Sender number (optional)</label>
                    <input
                      value={manualSenderNumber}
                      onChange={(e) => setManualSenderNumber(e.target.value)}
                      placeholder="03xx..."
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(15,138,95,.18)",
                        background: "rgba(15,138,95,.06)",
                        color: "inherit",
                      }}
                    />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={confirmManualPakistan} disabled={totalPKR <= 0}>
                  I have paid (Confirm on WhatsApp)
                </button>
              </div>

              <p className="muted" style={{ marginTop: 10 }}>
                Manual verification only: Please send payment screenshot/receipt on WhatsApp. No automation/webhook is used.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <aside className="sidebar" style={{ top: 86 }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {items.length === 0 ? "No items in cart." : `${items.length} item(s) selected`}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">Currency</span>
              <b>{currency}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span className="muted">Total</span>
              <b>{selectedTotalLabel}</b>
            </div>
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,138,95,.15)", paddingTop: 16 }}>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
              Need help? Use WhatsApp. For PKR manual payments, include your <b>Reference</b> and send receipt screenshot.
            </div>

            <a className="btn" href={whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp Support
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
