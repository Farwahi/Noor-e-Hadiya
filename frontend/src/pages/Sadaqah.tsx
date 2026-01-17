// src/pages/Sadaqah.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Service } from "../types";
import { addToCart } from "../cart";

type Currency = "GBP" | "PKR";

export default function Sadaqah() {
  const nav = useNavigate();

  const [currency, setCurrency] = useState<Currency>("GBP");
  const [amountGBP, setAmountGBP] = useState<number>(0);
  const [amountPKR, setAmountPKR] = useState<number>(0);
  const [custom, setCustom] = useState<string>("");

  const activeAmount = useMemo(() => {
    if (custom.trim()) {
      const n = Number(custom.trim());
      return Number.isFinite(n) ? n : 0;
    }
    return currency === "GBP" ? amountGBP : amountPKR;
  }, [currency, amountGBP, amountPKR, custom]);

  const canProceed = activeAmount > 0;

  function chooseGBP(v: number) {
    setCurrency("GBP");
    setCustom("");
    setAmountGBP(v);
    setAmountPKR(0);
  }

  function choosePKR(v: number) {
    setCurrency("PKR");
    setCustom("");
    setAmountPKR(v);
    setAmountGBP(0);
  }

  function proceed() {
    if (!canProceed) return;

    const now = Date.now(); // unique id
    const donation: Service = {
      id: `sadaqah-${currency.toLowerCase()}-${activeAmount}-${now}`,
      name: "General Sadaqah",
      countLabel: "Donation",
      priceGBP: currency === "GBP" ? activeAmount : 0,
      pricePKR: currency === "PKR" ? Math.round(activeAmount) : 0,
      category: "Sadaqah",
    };

    addToCart(donation);
    nav("/cart");
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="sadaqah-card">
          {/* Header */}
          <div className="sadaqah-head">
            <img className="sadaqah-img" src="/sadaqah.png" alt="Sadaqah" />
            <div>
              <div className="sadaqah-title">General Sadaqah</div>
              <div className="sadaqah-subtitle">Any Amount</div>
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

              {/* PKR */}
              <div className="sadaqah-col">
                <div className="sadaqah-col-title">Pakistani Rupee (PKR)</div>
                <div className="sadaqah-chips">
                  <button
                    className={`sadaqah-chip wide ${currency === "PKR" && amountPKR === 200 ? "active" : ""}`}
                    onClick={() => choosePKR(200)}
                    type="button"
                  >
                    PKR 200
                  </button>
                  <button
                    className={`sadaqah-chip wide ${currency === "PKR" && amountPKR === 300 ? "active" : ""}`}
                    onClick={() => choosePKR(300)}
                    type="button"
                  >
                    PKR 300
                  </button>
                  <button
                    className={`sadaqah-chip wide ${currency === "PKR" && amountPKR === 500 ? "active" : ""}`}
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
              <div className="sadaqah-label">
                Or enter custom amount ({currency}):
              </div>
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
            <button
              className="sadaqah-cta-btn"
              onClick={proceed}
              disabled={!canProceed}
              type="button"
            >
              Proceed with Contribution
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
