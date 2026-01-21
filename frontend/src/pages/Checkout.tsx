import React, { useEffect, useMemo, useState } from "react";
import { getCart, clearCart } from "../cart";
import type { CartItem, PaymentDetailsResponse } from "../types";
import { createCheckoutSession, getPaymentDetails } from "../api";

type Currency = "GBP" | "PKR" | "USD";
type ManualMethod = "EasyPaisa" | "JazzCash" | "UPaisa" | "Bank Transfer";

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>(() => getCart() as CartItem[]);
  const [data, setData] = useState<PaymentDetailsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ currency
  const [currency, setCurrency] = useState<Currency>("GBP");

  // ✅ additional info
  const [deceasedName, setDeceasedName] = useState("");
  const [notes, setNotes] = useState("");

  // ✅ PKR manual fields
  const [manualMethod, setManualMethod] = useState<ManualMethod>("EasyPaisa");
  const [manualTxnId, setManualTxnId] = useState("");
  const [manualPayerName, setManualPayerName] = useState("");
  const [manualSenderNumber, setManualSenderNumber] = useState("");

  // ✅ Live FX rate (GBP -> USD) (with cache fallback)
  const [gbpUsd, setGbpUsd] = useState<number>(() => {
    const raw = localStorage.getItem("neh_gbp_usd");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // ✅ Reference ID (persist)
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

  // ✅ WhatsApp support number
  const whatsappNumber = "447551214149";

  // ✅ totals (base prices stored in cart)
  const totalGBP = useMemo(
    () => items.reduce((s, it) => s + Number((it as any).priceGBP || 0), 0),
    [items]
  );

  const totalPKR = useMemo(
    () => items.reduce((s, it) => s + Number((it as any).pricePKR || 0), 0),
    [items]
  );

  // ✅ USD stored sum (if items have priceUSD saved like Sadaqah)
  const totalUSDStored = useMemo(() => {
    return items.reduce((s, it) => s + Number((it as any).priceUSD || 0), 0);
  }, [items]);

  // ✅ USD display total (always shows something; for UI only)
  const totalUSDDisplay = useMemo(() => {
    if (totalUSDStored > 0) return totalUSDStored;
    if (gbpUsd && Number.isFinite(gbpUsd) && gbpUsd > 0) return totalGBP * gbpUsd;
    return totalGBP; // display fallback only
  }, [totalUSDStored, gbpUsd, totalGBP]);

  // ✅ USD Stripe total (must be REAL — no fake fallback)
  const totalUSDForStripe = useMemo(() => {
    if (totalUSDStored > 0) return totalUSDStored;
    if (gbpUsd && Number.isFinite(gbpUsd) && gbpUsd > 0) return totalGBP * gbpUsd;
    return 0; // if no reliable USD, block Stripe USD
  }, [totalUSDStored, gbpUsd, totalGBP]);

  const selectedTotalLabel =
    currency === "GBP"
      ? `£${totalGBP.toFixed(2)}`
      : currency === "USD"
      ? `$${totalUSDDisplay.toFixed(2)}`
      : `PKR ${Math.round(totalPKR).toLocaleString()}`;

  const description = useMemo(() => {
    if (items.length === 0) return "Noor-e-Hadiya Order";
    const counts = new Map<string, number>();
    items.forEach((x) => counts.set(x.name, (counts.get(x.name) || 0) + 1));
    return Array.from(counts.entries())
      .map(([n, q]) => `${n} x${q}`)
      .join(", ");
  }, [items]);

  // ✅ Helper: clipboard
  function copyText(txt: string) {
    if (!txt) return;
    navigator.clipboard?.writeText(txt).catch(() => {});
  }

  // ✅ WhatsApp prefilled message (Option B)
  const whatsappMessage = useMemo(() => {
    const totalLine =
      currency === "GBP"
        ? `£${totalGBP.toFixed(2)}`
        : currency === "USD"
        ? `$${totalUSDDisplay.toFixed(2)}`
        : `PKR ${Math.round(totalPKR).toLocaleString()}`;

    const lines = [
      "Assalamu Alaikum, I have placed an order on Noor-e-Hadiya.",
      `Reference: ${referenceId}`,
      `Selected services: ${description}`,
      `Currency: ${currency}`,
      `Total: ${totalLine}`,
      deceasedName ? `Deceased name: ${deceasedName}` : "",
      notes ? `Notes: ${notes}` : "",
      currency === "USD" && gbpUsd ? `Rate used: 1 GBP = ${gbpUsd.toFixed(4)} USD` : "",
      "",
      currency === "PKR" ? "MANUAL PAYMENT DETAILS:" : "",
      currency === "PKR" ? `Method: ${manualMethod}` : "",
      currency === "PKR" && manualTxnId ? `Transaction ID: ${manualTxnId}` : "",
      currency === "PKR" && manualPayerName ? `Payer name: ${manualPayerName}` : "",
      currency === "PKR" && manualSenderNumber ? `Sender number: ${manualSenderNumber}` : "",
      currency === "PKR" ? "I am sending the receipt screenshot now." : "",
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  }, [
    currency,
    totalGBP,
    totalUSDDisplay,
    totalPKR,
    referenceId,
    description,
    deceasedName,
    notes,
    gbpUsd,
    manualMethod,
    manualTxnId,
    manualPayerName,
    manualSenderNumber,
  ]);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ✅ Stripe success redirect + payment details
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const isSuccess = qs.get("success") === "1";

    if (isSuccess) {
      clearCart();
      setItems([]);
      setSuccess(true);

      // reset ref for next order
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
      .then((res) => setData(res.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Live rate fetch only when USD selected (30 min cache) — robust + cached fallback
  useEffect(() => {
    async function loadRateIfNeeded() {
      if (currency !== "USD") return;

      try {
        setRateError(null);

        const cacheRaw = localStorage.getItem("neh_fx_cache_gbp_usd");
        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw) as { ts: number; rate: number };
          if (cache?.rate && Date.now() - cache.ts < 30 * 60 * 1000) {
            setGbpUsd(cache.rate);
            return;
          }
        }

        setRateLoading(true);

        const r = await fetch("https://open.er-api.com/v6/latest/GBP");
        const j = await r.json();
        const rate = Number(j?.rates?.USD);

        if (!rate || !Number.isFinite(rate)) throw new Error("Live USD rate not available");

        setGbpUsd(rate);
        localStorage.setItem("neh_gbp_usd", String(rate));
        localStorage.setItem("neh_fx_cache_gbp_usd", JSON.stringify({ ts: Date.now(), rate }));
      } catch (e: any) {
        const cached = Number(localStorage.getItem("neh_gbp_usd") || 0);
        if (cached && Number.isFinite(cached) && cached > 0) {
          setGbpUsd(cached);
          setRateError("Live rate failed, using cached rate");
        } else {
          setRateError(e?.message || "Failed to load live USD rate");
        }
      } finally {
        setRateLoading(false);
      }
    }

    loadRateIfNeeded();
  }, [currency]);

  // ✅ Stripe pay (GBP or USD)
  async function payNowStripe() {
    const isOnline = currency === "GBP" || currency === "USD";
    if (!isOnline) return;

    const stripeCurrency = currency === "GBP" ? "gbp" : "usd";
    const amount = currency === "GBP" ? totalGBP : totalUSDForStripe;

    if (currency === "USD" && amount <= 0) {
      alert("USD rate is not ready. Please wait a moment or use GBP.");
      return;
    }
    if (amount <= 0) return;

    try {
      setPaying(true);

      const extra = [
        deceasedName ? `Deceased: ${deceasedName}` : "",
        notes ? `Notes: ${notes}` : "",
        `Ref: ${referenceId}`,
        currency === "USD" && gbpUsd ? `Rate:1GBP=${gbpUsd.toFixed(4)}USD` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const fullDesc = extra ? `${description} | ${extra}` : description;

      const res = await createCheckoutSession({
        amount,
        currency: stripeCurrency,
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

  // ✅ PKR confirm: open WhatsApp with all details (Option B)
  function confirmManualPakistan() {
    if (totalPKR <= 0) return;
    if (!manualTxnId.trim()) {
      alert("Please enter Transaction ID to confirm on WhatsApp.");
      return;
    }
    window.open(whatsappLink, "_blank");
  }

  if (loading)
    return (
      <p className="muted" style={{ padding: "18px 16px" }}>
        Loading…
      </p>
    );

  // ✅ PK details per method (fallback to old PK shape if you haven't updated backend yet)
  const pkOldName = (data as any)?.PK?.accountName || "Noor-e-Hadiya";
  const pkOldNumber = (data as any)?.PK?.accountNumber || "03XX-XXXXXXX";

  const pkEasy = (data as any)?.PK?.easyPaisa;
  const pkJazz = (data as any)?.PK?.jazzCash;
  const pkUP = (data as any)?.PK?.uPaisa;
  const pkBank = (data as any)?.PK?.bank;

  const pkSelected = (() => {
    if (!pkEasy && !pkJazz && !pkUP && !pkBank) {
      return { accountName: pkOldName, accountNumber: pkOldNumber, note: "" };
    }
    if (manualMethod === "EasyPaisa") return pkEasy || { accountName: pkOldName, accountNumber: pkOldNumber, note: "" };
    if (manualMethod === "JazzCash") return pkJazz || { accountName: pkOldName, accountNumber: pkOldNumber, note: "" };
    if (manualMethod === "UPaisa") return pkUP || { accountName: pkOldName, accountNumber: pkOldNumber, note: "" };
    return pkBank || { accountName: pkOldName, accountNumber: pkOldNumber, note: "" };
  })();

  const pkSelectedName = pkSelected?.accountName || pkOldName;
  const pkSelectedNumber = pkSelected?.accountNumber || pkOldNumber;
  const pkSelectedNote = pkSelected?.note || "";

  // UK bank details (optional)
  const ukProvider = data?.UK?.provider || "Wise";
  const ukAccountName = data?.UK?.accountName || "Noor-e-Hadiya";
  const ukSortCode = data?.UK?.sortCode || "";
  const ukAccountNumber = data?.UK?.accountNumber || "";

  const usdInfoText =
    currency === "USD"
      ? rateLoading
        ? "Loading live USD rate..."
        : rateError
        ? `Live rate info: ${rateError}`
        : gbpUsd
        ? `Live rate: 1 GBP = ${gbpUsd.toFixed(4)} USD`
        : "Live rate not loaded"
      : "";

  const usdReady = currency !== "USD" || totalUSDForStripe > 0;

  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 980 }}>
        {/* Header + top-right currency */}
        <div
          className="checkout-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="page-heading" style={{ marginBottom: 6 }}>
              Checkout
            </h1>
            <p className="muted" style={{ marginTop: 0 }}>
              Pay online (GBP/USD) or manually (PKR). For manual payments, click WhatsApp to send receipt screenshot.
            </p>
          </div>

          <div style={{ minWidth: 260 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
              Currency
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(15,138,95,.18)",
                background: "rgba(255,255,255,.7)",
                color: "inherit",
              }}
            >
              <option value="GBP">GBP (United Kingdom)</option>
              <option value="USD">USD (United States) — Live conversion</option>
              <option value="PKR">PKR (Pakistan)</option>
            </select>

            <div style={{ marginTop: 10 }}>
              <span className="muted">Total:</span> <b>{selectedTotalLabel}</b>
            </div>

            {currency === "USD" && (
              <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.4 }}>
                {usdInfoText}
              </div>
            )}
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
            {/* Selected services */}
            <div className="card" style={{ marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>1) Selected Services</h3>

              {items.length === 0 ? (
                <p className="muted">No selected items.</p>
              ) : (
                <>
                  <ul style={{ marginTop: 10 }}>
                    {items.map((it, idx) => {
                      const label =
                        ("countLabel" in (it as any) && (it as any).countLabel)
                          ? (it as any).countLabel
                          : "Donation";

                      const pGBP = Number((it as any).priceGBP || 0);
                      const pPKR = Number((it as any).pricePKR || 0);
                      const storedUSD = Number((it as any).priceUSD || 0);

                      // ✅ USD line price: prefer stored USD else convert from GBP using rate else fallback GBP for display
                      const pUSD =
                        storedUSD > 0 ? storedUSD : gbpUsd && gbpUsd > 0 ? pGBP * gbpUsd : pGBP;

                      return (
                        <li key={`${(it as any).id}-${idx}`}>
                          {it.name} ({label}) —{" "}
                          {currency === "GBP"
                            ? `£${pGBP.toFixed(2)}`
                            : currency === "USD"
                            ? `$${pUSD.toFixed(2)}`
                            : `PKR ${Math.round(pPKR).toLocaleString()}`}
                        </li>
                      );
                    })}
                  </ul>

                  <div style={{ marginTop: 10 }}>
                    <b>Total:</b> {selectedTotalLabel}
                  </div>
                </>
              )}
            </div>

            {/* Additional info */}
            <div className="card" style={{ marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>2) Additional Information</h3>

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
                    background: "rgba(255,255,255,.7)",
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
                    background: "rgba(255,255,255,.7)",
                    color: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <a className="btn" href={whatsappLink} target="_blank" rel="noreferrer" style={{ width: "auto", marginTop: 0 }}>
                  WhatsApp us for details
                </a>
                <span className="muted" style={{ alignSelf: "center" }}>
                  +44 7551 214149
                </span>
              </div>
            </div>

            {/* Online payment */}
            {(currency === "GBP" || currency === "USD") && (
              <div className="card" style={{ marginBottom: 14 }}>
                <h3 style={{ marginTop: 0 }}>3) Pay Online ({currency})</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  Card / Apple Pay / Google Pay (Apple/Google Pay appears automatically when supported).
                </p>

                <button
                  className="btn btn-primary"
                  onClick={payNowStripe}
                  disabled={
                    paying ||
                    (currency === "GBP" ? totalGBP <= 0 : totalUSDForStripe <= 0) ||
                    (currency === "USD" && !usdReady)
                  }
                >
                  {paying
                    ? "Redirecting..."
                    : currency === "GBP"
                    ? `Pay £${totalGBP.toFixed(2)} with Stripe`
                    : `Pay $${totalUSDDisplay.toFixed(2)} with Stripe`}
                </button>

                {currency === "USD" && (
                  <div className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
                    {usdInfoText}
                    {!usdReady ? (
                      <div style={{ marginTop: 6 }}>
                        USD payment needs live rate (or stored USD prices). Please wait or use GBP.
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Optional: UK bank details */}
                <div style={{ marginTop: 14, borderTop: "1px solid rgba(15,138,95,.12)", paddingTop: 12 }}>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    <b>Optional:</b> UK Bank Transfer
                  </div>
                  <div>
                    <b>Provider:</b> {ukProvider}
                  </div>
                  <div>
                    <b>Account Name:</b> {ukAccountName}
                  </div>
                  {ukSortCode ? (
                    <div>
                      <b>Sort Code:</b> {ukSortCode}
                    </div>
                  ) : null}
                  {ukAccountNumber ? (
                    <div>
                      <b>Account Number:</b> {ukAccountNumber}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* PKR manual payment (Option B) */}
            {currency === "PKR" && (
              <div className="card" style={{ marginBottom: 14 }}>
                <h3 style={{ marginTop: 0 }}>3) Manual Payment (PKR)</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  Select method, send payment, then click WhatsApp to send your receipt screenshot for verification.
                </p>

                <div
                  style={{
                    border: "1px solid rgba(15,138,95,.18)",
                    borderRadius: 14,
                    padding: 14,
                    background: "rgba(255,255,255,.55)",
                  }}
                >
                  {/* Reference */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <b>Reference:</b> <span style={{ letterSpacing: 0.4 }}>{referenceId}</span>
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(referenceId)} style={{ width: "auto" }}>
                      Copy Ref
                    </button>
                  </div>

                  <hr style={{ opacity: 0.15, margin: "14px 0" }} />

                  {/* Method */}
                  <div className="field">
                    <label className="muted">Choose manual payment method</label>
                    <select
                      value={manualMethod}
                      onChange={(e) => setManualMethod(e.target.value as ManualMethod)}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(15,138,95,.18)",
                        background: "rgba(255,255,255,.7)",
                        color: "inherit",
                        maxWidth: 520,
                      }}
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="UPaisa">UPaisa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                    <div>
                      <b>Send PKR:</b> {Math.round(totalPKR).toLocaleString()}
                    </div>
                    <button className="btn" type="button" onClick={() => copyText(String(Math.round(totalPKR)))} style={{ width: "auto" }}>
                      Copy Amount
                    </button>
                  </div>

                  {/* Selected method details ONLY */}
                  <div style={{ marginTop: 14 }}>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Showing details for: <b>{manualMethod}</b>
                    </div>

                    <div>
                      <b>Account Name:</b> {pkSelectedName}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                      <div>
                        <b>{manualMethod === "Bank Transfer" ? "Account Number" : "Wallet Number"}:</b> {pkSelectedNumber}
                      </div>
                      <button className="btn" type="button" onClick={() => copyText(pkSelectedNumber)} style={{ width: "auto" }}>
                        Copy Number
                      </button>
                    </div>

                    {pkSelectedNote ? <div className="muted" style={{ marginTop: 8 }}>{pkSelectedNote}</div> : null}

                    <div className="muted" style={{ marginTop: 8 }}>
                      In payment “message/notes”, write this reference: <b>{referenceId}</b>
                    </div>
                  </div>

                  <hr style={{ opacity: 0.15, margin: "14px 0" }} />

                  {/* Customer inputs */}
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
                        background: "rgba(255,255,255,.7)",
                        color: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
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
                          background: "rgba(255,255,255,.7)",
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
                          background: "rgba(255,255,255,.7)",
                          color: "inherit",
                        }}
                      />
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={confirmManualPakistan} disabled={totalPKR <= 0}>
                    Confirm on WhatsApp (Send Receipt Screenshot)
                  </button>

                  <div className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
                    After payment, click the button above. WhatsApp will open with your order + transaction details.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT summary */}
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

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,138,95,.12)", paddingTop: 16 }}>
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
    </div>
  );
}
