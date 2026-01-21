// src/pages/Sadaqah.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DonationItem } from "../types";
import { addToCart } from "../cart";

type Currency = "GBP" | "USD" | "PKR";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * ✅ Free FX endpoint (no key)
 * https://open.er-api.com/v6/latest/<BASE>
 * We only need GBP/USD/PKR rates.
 *
 * Small cache (30 minutes) to reduce calls and improve reliability.
 */
async function getRates(base: Currency): Promise<{ GBP: number; USD: number; PKR: number }> {
  const cacheKey = `neh_er_${base}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const obj = JSON.parse(cached) as { ts: number; rates: { GBP: number; USD: number; PKR: number } };
      if (obj?.ts && Date.now() - obj.ts < 30 * 60 * 1000) {
        const r = obj.rates;
        if (r?.GBP && r?.USD && r?.PKR) return r;
      }
    } catch {}
  }

  const url = `https://open.er-api.com/v6/latest/${base}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FX fetch failed (${res.status})`);

  const j = await res.json();
  const GBP = Number(j?.rates?.GBP);
  const USD = Number(j?.rates?.USD);
  const PKR = Number(j?.rates?.PKR);

  if (!GBP || !Number.isFinite(GBP)) throw new Error("GBP rate not available");
  if (!USD || !Number.isFinite(USD)) throw new Error("USD rate not available");
  if (!PKR || !Number.isFinite(PKR)) throw new Error("PKR rate not available");

  const rates = { GBP, USD, PKR };
  localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rates }));
  return rates;
}

export default function Sadaqah() {
  const nav = useNavigate();

  const [currency, setCurrency] = useState<Currency>("GBP");
  const [amountGBP, setAmountGBP] = useState<number>(0);
  const [amountUSD, setAmountUSD] = useState<number>(0);
  const [amountPKR, setAmountPKR] = useState<number>(0);
  const [custom, setCustom] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const activeAmount = useMemo(() => {
    if (custom.trim()) {
      const n = Number(custom.trim());
      return Number.isFinite(n) ? n : 0;
    }
    if (currency === "GBP") return amountGBP;
    if (currency === "USD") return amountUSD;
    return amountPKR;
  }, [currency, amountGBP, amountUSD, amountPKR, custom]);

  const canProceed = activeAmount > 0 && !saving;

  function chooseGBP(v: number) {
    setCurrency("GBP");
    setCustom("");
    setAmountGBP(v);
    setAmountUSD(0);
    setAmountPKR(0);
  }

  function chooseUSD(v: number) {
    setCurrency("USD");
    setCustom("");
    setAmountUSD(v);
    setAmountGBP(0);
    setAmountPKR(0);
  }

  function choosePKR(v: number) {
    setCurrency("PKR");
    setCustom("");
    setAmountPKR(v);
    setAmountGBP(0);
    setAmountUSD(0);
  }

  async function proceed() {
    if (!canProceed) return;

    setSaving(true);
    try {
      const now = Date.now();
      const amt = Number(activeAmount);

      // ✅ Compute ALL currencies so Cart totals always show properly
      let priceGBP = 0;
      let priceUSD = 0;
      let pricePKR = 0;

      try {
        const r = await getRates(currency); // base = selected currency

        // rates are: 1 <base> = r.GBP GBP, r.USD USD, r.PKR PKR
        priceGBP = amt * r.GBP;
        priceUSD = amt * r.USD;
        pricePKR = amt * r.PKR;

      } catch (e) {
        // ✅ fallback: never block user (still no 0 for all)
        if (currency === "GBP") {
          priceGBP = amt;
          priceUSD = amt; // fallback 1:1
          pricePKR = 0;
        } else if (currency === "USD") {
          priceUSD = amt;
          priceGBP = amt; // fallback 1:1
          pricePKR = 0;
        } else {
          // PKR
          pricePKR = amt;
          priceGBP = 0.01; // minimal non-zero
          priceUSD = 0.01;
        }
      }

      const donation: DonationItem = {
        id: `don-sadaqah-${currency.toLowerCase()}-${Math.round(amt)}-${now}`,
        name: "General Sadaqah",

        // ✅ Always store all three
        priceGBP: round2(priceGBP),
        priceUSD: round2(priceUSD),
        pricePKR: Math.round(pricePKR),

        category: "Sadaqah",
        isDonation: true,

        donationGBP: currency === "GBP" ? amt : undefined,
        donationUSD: currency === "USD" ? amt : undefined,
        donationPKR: currency === "PKR" ? Math.round(amt) : undefined,
      };

      addToCart(donation, 1);
      nav("/cart");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="sadaqah-card">
          {/* Header */}
          <div className="sadaqah-head">
            <img className="sadaqah-img" src="/sadaqah.png" alt="Sadaqah" />
            <div>
              <div className="sadaqah-title">Sadaqah & Voluntary Donations</div>
              <div className="sadaqah-subtitle">Any Amount</div>
              <p className="sadaqah-desc">
                Noor-e-Hadiya is a faith-based community initiative. Voluntary sadaqah contributions are distributed to
                support underprivileged families and are not linked to any specific service order.
              </p>
            </div>
          </div>

          {/* White Box */}
          <div className="sadaqah-box">
            <div className="sadaqah-grid">
              {/* GBP */}
              <div className="sadaqah-col">
                <div className="sadaqah-col-title">British Pound (GBP)</div>
                <div className="sadaqah-chips">
                  <button
                    className={`sadaqah-chip ${currency === "GBP" && amountGBP === 1 ? "active" : ""}`}
                    onClick={() => chooseGBP(1)}
                    type="button"
                  >
                    £1
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "GBP" && amountGBP === 2 ? "active" : ""}`}
                    onClick={() => chooseGBP(2)}
                    type="button"
                  >
                    £2
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "GBP" && amountGBP === 5 ? "active" : ""}`}
                    onClick={() => chooseGBP(5)}
                    type="button"
                  >
                    £5
                  </button>
                </div>
              </div>

              {/* USD */}
              <div className="sadaqah-col">
                <div className="sadaqah-col-title">US Dollar (USD)</div>
                <div className="sadaqah-chips">
                  <button
                    className={`sadaqah-chip ${currency === "USD" && amountUSD === 2 ? "active" : ""}`}
                    onClick={() => chooseUSD(2)}
                    type="button"
                  >
                    $2
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "USD" && amountUSD === 5 ? "active" : ""}`}
                    onClick={() => chooseUSD(5)}
                    type="button"
                  >
                    $5
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "USD" && amountUSD === 10 ? "active" : ""}`}
                    onClick={() => chooseUSD(10)}
                    type="button"
                  >
                    $10
                  </button>
                </div>
              </div>

              {/* PKR */}
              <div className="sadaqah-col">
                <div className="sadaqah-col-title">Pakistani Rupee (PKR)</div>
                <div className="sadaqah-chips">
                  <button
                    className={`sadaqah-chip ${currency === "PKR" && amountPKR === 200 ? "active" : ""}`}
                    onClick={() => choosePKR(200)}
                    type="button"
                  >
                    PKR 200
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "PKR" && amountPKR === 300 ? "active" : ""}`}
                    onClick={() => choosePKR(300)}
                    type="button"
                  >
                    PKR 300
                  </button>
                  <button
                    className={`sadaqah-chip ${currency === "PKR" && amountPKR === 500 ? "active" : ""}`}
                    onClick={() => choosePKR(500)}
                    type="button"
                  >
                    PKR 500
                  </button>
                </div>
              </div>
            </div>

            <div className="sadaqah-divider" />

            {/* Custom */}
            <div className="sadaqah-custom">
              <div className="sadaqah-label">Or enter custom amount ({currency}):</div>
              <input
                className="sadaqah-input"
                placeholder="Enter amount"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="sadaqah-cta">
            <button className="sadaqah-cta-btn" onClick={proceed} disabled={!canProceed} type="button">
              {saving ? "Please wait..." : "Proceed with Contribution"}
            </button>
          </div>

          <div className="sadaqah-note">
            All contributions are used for religious services according to Islamic guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}
