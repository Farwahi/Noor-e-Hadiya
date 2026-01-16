import React, { useEffect, useMemo, useState } from "react";
import { getCart, clearCart } from "../cart";
import type { Service } from "../types";
import { createCheckoutSession, getPaymentDetails, PaymentDetailsResponse } from "../api";

export default function Checkout() {
  const [items, setItems] = useState<Service[]>(() => getCart());
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

  const totalGBP = useMemo(() => items.reduce((s, it) => s + it.priceGBP, 0), [items]);
  const totalPKR = useMemo(() => items.reduce((s, it) => s + it.pricePKR, 0), [items]);

  const selectedTotalLabel = currency === "GBP" ? `£${totalGBP.toFixed(2)}` : `PKR ${totalPKR.toFixed(0)}`;

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
      `Selected services: ${description}`,
      `Currency: ${currency}`,
      `Total: ${currency === "GBP" ? `£${totalGBP.toFixed(2)}` : `PKR ${totalPKR.toFixed(0)}`}`,
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

      // add extra info into Stripe description (simple)
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

  if (loading) return <p>Loading…</p>;

  // ✅ Wallet receiver (same object for EasyPaisa/JazzCash/UPaisa)
  const walletName = data?.PK?.accountName || "Noor-e-Hadiya";
  const walletNumber = data?.PK?.accountNumber || "03XX-XXXXXXX";

  // ✅ Bank transfer fields (will be added from backend later)
  const bankName = (data as any)?.PK?.bank?.bankName || "";
  const bankTitle = (data as any)?.PK?.bank?.accountTitle || "";
  const bankIban = (data as any)?.PK?.bank?.iban || "";
  const bankAccount = (data as any)?.PK?.bank?.accountNumber || "";
  const bankSwift = (data as any)?.PK?.bank?.swift || "";

  return (
    <div className="container" style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1>Checkout</h1>
      <p className="muted">Select currency, then choose Stripe (online) or manual payment.</p>

      {success && (
        <div style={{ border: "1px solid #2ecc71", padding: 14, borderRadius: 10, marginBottom: 18 }}>
          ✅ <b>Payment successful!</b> Thank you. Your cart has been cleared.
        </div>
      )}

      {/* ✅ Currency selector */}
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h3>Choose Currency</h3>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as "GBP" | "PKR")}
          style={{ padding: 10, borderRadius: 10, width: 280 }}
        >
          <option value="GBP">GBP (United Kingdom)</option>
          <option value="PKR">PKR (Pakistan)</option>
        </select>

        <div style={{ marginTop: 12 }}>
          <b>Total:</b> {currency === "GBP" ? `£${totalGBP.toFixed(2)}` : `PKR ${totalPKR.toFixed(0)}`}
        </div>
      </div>

      {/* ✅ Selected Services */}
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h3>Selected Services</h3>

        {items.length === 0 ? (
          <p className="muted">No selected items.</p>
        ) : (
          <>
            <ul>
              {items.map((it, idx) => (
                <li key={`${it.id}-${idx}`}>
                  {it.name} ({it.countLabel}) —{" "}
                  {currency === "GBP" ? `£${it.priceGBP.toFixed(2)}` : `PKR ${it.pricePKR.toFixed(0)}`}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 10 }}>
              <b>Total:</b> {selectedTotalLabel}
              {currency === "GBP" && <span className="muted"> (PKR {totalPKR.toFixed(0)})</span>}
              {currency === "PKR" && <span className="muted"> ( £{totalGBP.toFixed(2)} )</span>}
            </div>
          </>
        )}
      </div>

      {/* ✅ Additional Information */}
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h3>Additional Information</h3>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="muted">Name of deceased person</label>
            <input
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              placeholder="e.g., Marhoom/Marhooma (Name)"
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
            />
          </div>

          <div>
            <label className="muted">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special request (optional)"
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="btn" href={whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp us for details
            </a>

            <span className="muted" style={{ alignSelf: "center" }}>
              Number: +44 7551 214149
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Stripe section ONLY when GBP */}
      {currency === "GBP" && (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <h3>Pay Online (Card / Apple Pay / Google Pay)</h3>
          <p className="muted">Apple Pay / Google Pay will show automatically if supported.</p>

          <button className="btn btn-primary" onClick={payNowStripe} disabled={paying || totalGBP <= 0}>
            {paying ? "Redirecting..." : `Pay £${totalGBP.toFixed(2)} with Stripe`}
          </button>
        </div>
      )}

      {/* ✅ Manual Pakistan ONLY when PKR */}
      {currency === "PKR" && (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <h3>Manual Payment (PKR)</h3>
          <p className="muted">
            Pay using EasyPaisa / JazzCash (or UPaisa/Bank Transfer), then WhatsApp us your receipt for confirmation.
          </p>

          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16 }}>
            {/* Reference */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <b>Reference:</b> {referenceId}
              </div>
              <button className="btn" type="button" onClick={() => copyText(referenceId)}>
                Copy Ref
              </button>
            </div>

            <hr style={{ opacity: 0.15, margin: "14px 0" }} />

            {/* Method selector */}
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              <label className="muted">Choose manual payment method</label>
              <select
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value as any)}
                style={{ padding: 10, borderRadius: 10, width: 320, maxWidth: "100%" }}
              >
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="UPaisa">UPaisa (Optional)</option>
                <option value="Bank Transfer">Bank Transfer (Optional)</option>
              </select>
            </div>

            {/* Amount */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <b>Send PKR:</b> {totalPKR.toFixed(0)}
              </div>
              <button className="btn" type="button" onClick={() => copyText(String(Math.round(totalPKR)))}>
                Copy Amount
              </button>
            </div>

            {/* ✅ Wallet details OR Bank details */}
            {manualMethod !== "Bank Transfer" ? (
              <>
                <div>
                  <b>Account Name:</b> {walletName}
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <b>Account Number:</b> {walletNumber}
                  </div>
                  <button className="btn" type="button" onClick={() => copyText(walletNumber)}>
                    Copy Number
                  </button>
                </div>

                <div className="muted" style={{ marginTop: 8 }}>
                  In payment “message/notes”, write this reference: <b>{referenceId}</b>
                </div>
              </>
            ) : (
              <>
                <div className="muted" style={{ marginTop: 8 }}>
                  Use bank transfer details below and include reference: <b>{referenceId}</b>
                </div>

                {bankName && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <div>
                      <b>Bank Name:</b> {bankName}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(bankName)}>
                      Copy
                    </button>
                  </div>
                )}

                {bankTitle && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <div>
                      <b>Account Title:</b> {bankTitle}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(bankTitle)}>
                      Copy
                    </button>
                  </div>
                )}

                {bankIban && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <div>
                      <b>IBAN:</b> {bankIban}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(bankIban)}>
                      Copy IBAN
                    </button>
                  </div>
                )}

                {bankAccount && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <div>
                      <b>Account Number:</b> {bankAccount}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(bankAccount)}>
                      Copy Acc
                    </button>
                  </div>
                )}

                {bankSwift && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <div>
                      <b>SWIFT:</b> {bankSwift}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(bankSwift)}>
                      Copy SWIFT
                    </button>
                  </div>
                )}

                {!bankIban && !bankAccount && (
                  <div className="muted" style={{ marginTop: 10 }}>
                    Bank transfer details are not set yet. Please add PK.bank fields in backend payment-details response.
                  </div>
                )}
              </>
            )}

            <hr style={{ opacity: 0.15, margin: "14px 0" }} />

            {/* Manual verification fields */}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="muted">Transaction ID (required)</label>
                <input
                  value={manualTxnId}
                  onChange={(e) => setManualTxnId(e.target.value)}
                  placeholder="e.g., EP123456789 / JC123456789"
                  style={{ width: "100%", padding: 10, borderRadius: 10 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="muted">Payer name (optional)</label>
                  <input
                    value={manualPayerName}
                    onChange={(e) => setManualPayerName(e.target.value)}
                    placeholder="Your name"
                    style={{ width: "100%", padding: 10, borderRadius: 10 }}
                  />
                </div>

                <div>
                  <label className="muted">Sender number (optional)</label>
                  <input
                    value={manualSenderNumber}
                    onChange={(e) => setManualSenderNumber(e.target.value)}
                    placeholder="03xx..."
                    style={{ width: "100%", padding: 10, borderRadius: 10 }}
                  />
                </div>
              </div>

              <button className="btn btn-primary" onClick={confirmManualPakistan} disabled={totalPKR <= 0}>
                I have paid (Confirm on WhatsApp)
              </button>

              {!manualTxnId.trim() && (
                <div className="muted" style={{ fontSize: 12 }}>
                  Enter Transaction ID to confirm on WhatsApp.
                </div>
              )}
            </div>
          </div>

          <p className="muted" style={{ marginTop: 10 }}>
            Manual verification only: Please send payment screenshot/receipt on WhatsApp. No automation/webhook is used.
          </p>
        </div>
      )}
    </div>
  );
}
