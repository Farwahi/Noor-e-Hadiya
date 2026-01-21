import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../cart";

type Preset = "sunni_general" | "shia_sistani";
type Currency = "GBP" | "PKR" | "USD";

const symbols: Record<Currency, string> = { GBP: "£", PKR: "₨", USD: "$" };

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function int(v: any): number {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) ? x : 0;
}
function money(x: number): string {
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
}

export default function AllInOneIslamicCalculator() {
  const navigate = useNavigate();

  const [preset, setPreset] = useState<Preset>("sunni_general");
  const isShiaSistani = preset === "shia_sistani";
  const isSunni = preset === "sunni_general";

  const [currency, setCurrency] = useState<Currency>("GBP");
  const sym = symbols[currency];

  // ✅ LIVE METALS (backend route)
  const [metalsLoading, setMetalsLoading] = useState(false);
  const [metalsError, setMetalsError] = useState<string | null>(null);
  const [goldPerGram, setGoldPerGram] = useState<number>(0);
  const [silverPerGram, setSilverPerGram] = useState<number>(0);
  const [metalsUpdatedAt, setMetalsUpdatedAt] = useState<string>("");

  async function fetchMetals(currency: Currency) {
    const paths = [
      `/api/metals?currency=${encodeURIComponent(currency)}`,
      `http://localhost:4000/api/metals?currency=${encodeURIComponent(currency)}`,
    ];

    let lastErr: any = null;

    for (const url of paths) {
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (!j?.ok) throw new Error(j?.error || "Failed to load metals");
        return j;
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error("Failed to fetch metals");
  }

  async function loadMetalsLive() {
    setMetalsLoading(true);
    setMetalsError(null);

    try {
      const j = await fetchMetals(currency);
      setGoldPerGram(Number(j.data.goldPerGram) || 0);
      setSilverPerGram(Number(j.data.silverPerGram) || 0);

      const dt = j.data.updatedAt ? new Date(j.data.updatedAt) : new Date();
      setMetalsUpdatedAt(dt.toLocaleString());
    } catch (e: any) {
      setMetalsError(e?.message || "Failed to fetch metals");
    } finally {
      setMetalsLoading(false);
    }
  }

  useEffect(() => {
    loadMetalsLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  // =============================
  // CART HELPERS (ZAKAT / FITRANA -> DONATION ITEM)
  // =============================
  function buildDonationItem(params: {
    id: string;
    name: string;
    amount: number;
    currency: Currency;
  }) {
    const { id, name, amount, currency } = params;

    // IMPORTANT: include fallbacks so Cart totals never become 0
    const base: any = {
      id,
      name,
      countLabel: "Custom Request",
      category: "Additional",
      isDonation: true,
    };

    if (currency === "GBP") return { ...base, priceGBP: amount, price: amount };
    if (currency === "PKR") return { ...base, pricePKR: amount, pkr: amount, price: amount }; // ✅ add price
    return { ...base, priceUSD: amount, price: amount }; // USD
  }

  // =============================
  // ZAKAT - COMMON CONSTANTS
  // =============================
  const GOLD_NISAB_G = 87.48;
  const SILVER_NISAB_G = 612.36;

  const suggestedGoldNisab = useMemo(
    () => GOLD_NISAB_G * (goldPerGram || 0),
    [goldPerGram]
  );
  const suggestedSilverNisab = useMemo(
    () => SILVER_NISAB_G * (silverPerGram || 0),
    [silverPerGram]
  );

  // =============================
  // 1) SUNNI ZAKAT (wealth-based)
  // =============================
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [goldGrams, setGoldGrams] = useState("");
  const [silverGrams, setSilverGrams] = useState("");
  const [businessAssets, setBusinessAssets] = useState("");
  const [debts, setDebts] = useState("");

  const [nisabType, setNisabType] = useState<"gold" | "silver">("gold");
  const [nisabValue, setNisabValue] = useState("0");
  const [nisabManual, setNisabManual] = useState(false);

  useEffect(() => {
    if (nisabManual) return;
    if (!goldPerGram || !silverPerGram) return;

    const suggested =
      nisabType === "gold"
        ? GOLD_NISAB_G * goldPerGram
        : SILVER_NISAB_G * silverPerGram;

    setNisabValue(Number.isFinite(suggested) ? suggested.toFixed(2) : "0");
  }, [nisabType, goldPerGram, silverPerGram, nisabManual]);

  const sunniZakat = useMemo(() => {
    const goldValue = Math.max(0, n(goldGrams)) * Math.max(0, goldPerGram);
    const silverValue = Math.max(0, n(silverGrams)) * Math.max(0, silverPerGram);

    const total =
      n(cash) + n(bank) + goldValue + silverValue + n(businessAssets) - n(debts);

    const nisab = n(nisabValue);
    const eligible = nisab > 0 ? total >= nisab : total > 0;
    const payable = eligible ? total * 0.025 : 0;

    return { total, nisab, eligible, payable, goldValue, silverValue };
  }, [
    cash,
    bank,
    goldGrams,
    silverGrams,
    goldPerGram,
    silverPerGram,
    businessAssets,
    debts,
    nisabValue,
  ]);

  function addSunniZakatToCart() {
    const amount = Math.round(sunniZakat.payable * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const item = buildDonationItem({
      id: `zakat-${currency.toLowerCase()}-${Date.now()}`,
      name: "Zakat Payment",
      amount,
      currency,
    });

    addToCart(item);
    navigate("/cart");
  }

  // =============================
  // 2) SHIA ZAKAT (SISTANI STYLE)
  // =============================
  type ShiaZakatMode = "coins" | "manual";
  const [shiaMode, setShiaMode] = useState<ShiaZakatMode>("coins");

  const [shiaHasConditions, setShiaHasConditions] = useState(false);
  const [shiaCoinType, setShiaCoinType] = useState<"gold" | "silver">("gold");
  const [shiaCoinGrams, setShiaCoinGrams] = useState("0");

  const [shiaManualAmount, setShiaManualAmount] = useState("0");

  const shiaZakat = useMemo(() => {
    const grams = Math.max(0, n(shiaCoinGrams));
    const perGram = shiaCoinType === "gold" ? goldPerGram : silverPerGram;
    const value = grams * Math.max(0, perGram);

    const nisab =
      shiaCoinType === "gold" ? suggestedGoldNisab : suggestedSilverNisab;

    const eligible = shiaHasConditions && nisab > 0 ? value >= nisab : false;
    const payable = eligible ? value * 0.025 : 0;

    return { value, nisab, eligible, payable };
  }, [
    shiaCoinGrams,
    shiaCoinType,
    goldPerGram,
    silverPerGram,
    suggestedGoldNisab,
    suggestedSilverNisab,
    shiaHasConditions,
  ]);

  const shiaPayableFinal = useMemo(() => {
    if (shiaMode === "manual") return Math.max(0, n(shiaManualAmount));
    return shiaZakat.payable;
  }, [shiaMode, shiaManualAmount, shiaZakat.payable]);

  function addShiaZakatToCart() {
    const amount = Math.round(shiaPayableFinal * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const item = buildDonationItem({
      id: `shia-zakat-${currency.toLowerCase()}-${Date.now()}`,
      name: "Zakat Payment (Shia)",
      amount,
      currency,
    });

    addToCart(item);
    navigate("/cart");
  }

  // =============================
  // FITRANA (DEFAULT 0 + AUTO RATE PER CURRENCY + PAY BUTTON)
  // =============================
  const [people, setPeople] = useState("0");
  const [fitraRate, setFitraRate] = useState("0");

  const DEFAULT_FITRA_RATE: Record<Currency, number> = {
    GBP: 5,
    USD: 6,
    PKR: 1500,
  };

  const [fitraRateManual, setFitraRateManual] = useState(false);

  useEffect(() => {
    if (fitraRateManual) return;
    const def = DEFAULT_FITRA_RATE[currency] ?? 0;
    setFitraRate(String(def));
  }, [currency, fitraRateManual]);

  const fitrana = useMemo(() => {
    const p = Math.max(0, int(people));
    const rate = Math.max(0, n(fitraRate));
    return { people: p, rate, total: p * rate };
  }, [people, fitraRate]);

  function addFitranaToCart() {
    const amount = Math.round(fitrana.total * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const item = buildDonationItem({
      id: `fitrana-${currency.toLowerCase()}-${Date.now()}`,
      name: "Fitrana (Fitr)",
      amount,
      currency,
    });

    addToCart(item);
    navigate("/cart");
  }

  // =============================
  // KHUMS
  // =============================
  const [annualIncome, setAnnualIncome] = useState("");
  const [annualExpenses, setAnnualExpenses] = useState("");
  const [otherDeduct, setOtherDeduct] = useState("");

  const khums = useMemo(() => {
    const surplus = n(annualIncome) - n(annualExpenses) - n(otherDeduct);
    const positive = Math.max(0, surplus);
    const total = positive * 0.2;
    return { surplus, total, sahmImam: total / 2, sahmSadat: total / 2 };
  }, [annualIncome, annualExpenses, otherDeduct]);

  // =============================
  // QAZA NAMAZ
  // =============================
  const [namazDays, setNamazDays] = useState("0");
  const [includeWitr, setIncludeWitr] = useState(false);
  const [namazRate, setNamazRate] = useState("0");

  const qazaNamaz = useMemo(() => {
    const days = Math.max(0, int(namazDays));
    const base = days * 5;
    const witr = isSunni && includeWitr ? days : 0;
    const totalPrayers = base + witr;
    const cost = totalPrayers * Math.max(0, n(namazRate));
    return { base, witr, totalPrayers, cost };
  }, [namazDays, isSunni, includeWitr, namazRate]);

  // =============================
  // QAZA ROZA
  // =============================
  const [rozaDays, setRozaDays] = useState("0");
  const [rozaRate, setRozaRate] = useState("0");

  const qazaRoza = useMemo(() => {
    const days = Math.max(0, int(rozaDays));
    const cost = days * Math.max(0, n(rozaRate));
    return { days, cost };
  }, [rozaDays, rozaRate]);

  // =============================
  // SUMMARY
  // =============================
  const summary = useMemo(() => {
    const includeZakat = isSunni;
    const includeKhums = isShiaSistani;

    const total =
      (includeZakat ? sunniZakat.payable : 0) +
      fitrana.total +
      (includeKhums ? khums.total : 0) +
      (n(namazRate) > 0 ? qazaNamaz.cost : 0) +
      (n(rozaRate) > 0 ? qazaRoza.cost : 0);

    return { total, includeZakat, includeKhums };
  }, [
    isSunni,
    isShiaSistani,
    sunniZakat.payable,
    fitrana.total,
    khums.total,
    qazaNamaz.cost,
    qazaRoza.cost,
    namazRate,
    rozaRate,
  ]);

  return (
    <div className="calc-wrap">
      <div className="calc-card">
        <div className="calc-head">
          <div className="calc-title">
            <h3>All-in-One Islamic Calculator</h3>
            <p>Styled in Noor-e-Hadiya emerald theme</p>
          </div>

          <div className="calc-controls">
            <label>
              Fiqh
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as Preset)}
              >
                <option value="sunni_general">Sunni (General)</option>
                <option value="shia_sistani">Shia (Ayatollah Sistani)</option>
              </select>
            </label>

            <label>
              Currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (₨)</option>
              </select>
            </label>
          </div>
        </div>

        {/* =========================
            ZAKAT SECTION (SWITCHED)
           ========================= */}
        <Section
          title="1) Zakat"
          subtitle="Zakat rules differ by fiqh. This tool provides practical guidance."
        >
          <div className="calc-note" style={{ marginTop: 2 }}>
            {metalsLoading ? (
              <>Loading live gold & silver prices…</>
            ) : metalsError ? (
              <>⚠️ Live prices error: {metalsError}</>
            ) : (
              <>
                Live prices: Gold <b>{sym}{money(goldPerGram)}</b>/g, Silver{" "}
                <b>{sym}{money(silverPerGram)}</b>/g
                {metalsUpdatedAt ? <> (updated {metalsUpdatedAt})</> : null}
                {"  "}
                <button
                  type="button"
                  onClick={loadMetalsLive}
                  style={{
                    marginLeft: 10,
                    border: "1px solid rgba(15,138,95,.25)",
                    background: "#f4fff8",
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  Refresh
                </button>
              </>
            )}
          </div>

          <div className="calc-note" style={{ marginTop: 8 }}>
            Nisab uses live rates:{" "}
            <b>Gold Nisab = 87.48g × live gold price</b> (≈{" "}
            <b>
              {sym}
              {money(suggestedGoldNisab)}
            </b>
            ) | <b>Silver Nisab = 612.36g × live silver price</b> (≈{" "}
            <b>
              {sym}
              {money(suggestedSilverNisab)}
            </b>
            ).
          </div>

          {isSunni && (
            <>
              <div className="calc-grid" style={{ marginTop: 10 }}>
                <Field label={`Cash (${sym})`} value={cash} setValue={setCash} />
                <Field
                  label={`Bank Savings (${sym})`}
                  value={bank}
                  setValue={setBank}
                />
                <Field
                  label="Gold (grams)"
                  value={goldGrams}
                  setValue={setGoldGrams}
                />
                <Field
                  label="Silver (grams)"
                  value={silverGrams}
                  setValue={setSilverGrams}
                />
                <Field
                  label={`Business Assets (${sym})`}
                  value={businessAssets}
                  setValue={setBusinessAssets}
                />
                <Field
                  label={`Debts to Deduct (${sym})`}
                  value={debts}
                  setValue={setDebts}
                />
              </div>

              <div className="calc-row">
                <label>
                  Nisab Type{" "}
                  <select
                    value={nisabType}
                    onChange={(e) => setNisabType(e.target.value as any)}
                  >
                    <option value="gold">Gold Nisab</option>
                    <option value="silver">Silver Nisab</option>
                  </select>
                </label>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <Field
                    label={`Nisab Value (${sym})`}
                    value={nisabValue}
                    setValue={(v) => {
                      setNisabManual(true);
                      setNisabValue(v);
                    }}
                  />
                </div>
              </div>

              <div className="calc-result">
                <div>
                  Gold value:{" "}
                  <b>
                    {sym}
                    {money(sunniZakat.goldValue)}
                  </b>{" "}
                  &nbsp; | &nbsp; Silver value:{" "}
                  <b>
                    {sym}
                    {money(sunniZakat.silverValue)}
                  </b>
                </div>

                <div style={{ marginTop: 6 }}>
                  Total eligible wealth:{" "}
                  <b>
                    {sym}
                    {money(sunniZakat.total)}
                  </b>
                </div>
                <div>
                  Nisab ({nisabType}):{" "}
                  <b>
                    {sym}
                    {money(sunniZakat.nisab)}
                  </b>
                </div>
                <div>
                  Status:{" "}
                  <b
                    style={{
                      color: sunniZakat.eligible
                        ? "var(--emerald2)"
                        : "rgba(16,24,40,.7)",
                    }}
                  >
                    {sunniZakat.eligible ? "Zakat due" : "Below Nisab"}
                  </b>
                </div>

                <div className="big">
                  Zakat payable: {sym}
                  {money(sunniZakat.payable)}
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={addSunniZakatToCart}
                    disabled={!sunniZakat.eligible || sunniZakat.payable <= 0}
                    style={{
                      background: "var(--emerald)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "10px 14px",
                      cursor:
                        !sunniZakat.eligible || sunniZakat.payable <= 0
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        !sunniZakat.eligible || sunniZakat.payable <= 0 ? 0.6 : 1,
                      fontWeight: 700,
                    }}
                  >
                    Add Zakat to Cart ({sym}
                    {money(sunniZakat.payable)})
                  </button>
                </div>
              </div>
            </>
          )}

          {isShiaSistani && (
            <>
              <div className="calc-warn" style={{ marginTop: 10 }}>
                <b>Note (Ayatollah Sistani):</b> Zakat is obligatory on specific
                items (e.g., certain crops, livestock, and gold/silver coins
                under conditions). For most modern income/savings, <b>Khums</b>{" "}
                on yearly surplus is the main obligation. This section helps you
                calculate Shia-style Zakat in a safe way.
              </div>

              <div className="calc-row" style={{ marginTop: 10 }}>
                <label>
                  Shia Zakat Type{" "}
                  <select
                    value={shiaMode}
                    onChange={(e) => setShiaMode(e.target.value as ShiaZakatMode)}
                  >
                    <option value="coins">Gold/Silver coins (estimate)</option>
                    <option value="manual">Other zakat items (manual amount)</option>
                  </select>
                </label>
              </div>

              {shiaMode === "coins" && (
                <>
                  <div className="calc-grid" style={{ marginTop: 10 }}>
                    <div className="calc-field">
                      <label>
                        <div className="lbl">Coin Type</div>
                        <select
                          value={shiaCoinType}
                          onChange={(e) => setShiaCoinType(e.target.value as any)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: 12,
                            border: "1px solid rgba(15,138,95,.22)",
                          }}
                        >
                          <option value="gold">Gold coins</option>
                          <option value="silver">Silver coins</option>
                        </select>
                      </label>
                    </div>

                    <Field
                      label="Total coin weight (grams)"
                      value={shiaCoinGrams}
                      setValue={setShiaCoinGrams}
                    />
                  </div>

                  <div className="calc-row" style={{ marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={shiaHasConditions}
                        onChange={(e) => setShiaHasConditions(e.target.checked)}
                      />
                      Meets required conditions (owned for one year, valid zakat-eligible coins, etc.)
                    </label>
                  </div>

                  <div className="calc-result">
                    <div>
                      Coin value:{" "}
                      <b>
                        {sym}
                        {money(shiaZakat.value)}
                      </b>
                    </div>
                    <div>
                      Nisab ({shiaCoinType}):{" "}
                      <b>
                        {sym}
                        {money(shiaZakat.nisab)}
                      </b>
                    </div>
                    <div>
                      Status:{" "}
                      <b
                        style={{
                          color: shiaZakat.eligible
                            ? "var(--emerald2)"
                            : "rgba(16,24,40,.7)",
                        }}
                      >
                        {shiaZakat.eligible
                          ? "Zakat due"
                          : "Not due (conditions/nisab not met)"}
                      </b>
                    </div>
                    <div className="big">
                      Estimated Shia Zakat: {sym}
                      {money(shiaZakat.payable)}
                    </div>
                  </div>
                </>
              )}

              {shiaMode === "manual" && (
                <>
                  <div className="calc-note" style={{ marginTop: 10 }}>
                    Use this option for crops/livestock/other zakat items where detailed rules apply.
                    Enter the zakat amount based on your scholar guidance.
                  </div>

                  <div className="calc-grid" style={{ marginTop: 10 }}>
                    <Field
                      label={`Zakat amount (${sym})`}
                      value={shiaManualAmount}
                      setValue={setShiaManualAmount}
                    />
                  </div>

                  <div className="calc-result">
                    <div className="big">
                      Shia Zakat to pay: {sym}
                      {money(shiaPayableFinal)}
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={addShiaZakatToCart}
                  disabled={shiaPayableFinal <= 0}
                  style={{
                    background: "var(--emerald)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 14px",
                    cursor: shiaPayableFinal <= 0 ? "not-allowed" : "pointer",
                    opacity: shiaPayableFinal <= 0 ? 0.6 : 1,
                    fontWeight: 700,
                  }}
                >
                  Add Shia Zakat to Cart ({sym}
                  {money(shiaPayableFinal)})
                </button>
              </div>
            </>
          )}
        </Section>

        {/* 2) FITRANA */}
        <Section title="2) Fitrana (Fitr)" subtitle="Editable rate per person">
          <div className="calc-grid">
            <Field label="Number of People" value={people} setValue={setPeople} />

            <Field
              label={`Rate per Person (${sym})`}
              value={fitraRate}
              setValue={(v) => {
                setFitraRateManual(true); // ✅ user changed manually
                setFitraRate(v);
              }}
            />
          </div>

          <div className="calc-result">
            <div>
              People: <b>{fitrana.people}</b>
            </div>
            <div>
              Rate:{" "}
              <b>
                {sym}
                {money(fitrana.rate)}
              </b>
            </div>
            <div className="big">
              Total Fitrana: {sym}
              {money(fitrana.total)}
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={addFitranaToCart}
                disabled={fitrana.total <= 0}
                style={{
                  background: "var(--emerald)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: fitrana.total <= 0 ? "not-allowed" : "pointer",
                  opacity: fitrana.total <= 0 ? 0.6 : 1,
                  fontWeight: 700,
                }}
              >
                Pay Fitrana ({sym}
                {money(fitrana.total)})
              </button>
            </div>
          </div>

          <div className="calc-note">
            Fitrana depends on local staple/price (often equivalent of ~3kg food per person). Keep the rate editable.
          </div>
        </Section>

        {/* 3) KHUMS */}
        <Section title="3) Khums" subtitle="20% of yearly surplus (Sistani style estimate)">
          {!isShiaSistani && (
            <div className="calc-warn">
              Khums is mainly used in Ja‘fari (Shia) practice. If you are Sunni, you can ignore this section.
            </div>
          )}

          <div className="calc-grid">
            <Field label={`Annual Income (${sym})`} value={annualIncome} setValue={setAnnualIncome} />
            <Field label={`Annual Expenses (${sym})`} value={annualExpenses} setValue={setAnnualExpenses} />
            <Field label={`Other Deductions (${sym})`} value={otherDeduct} setValue={setOtherDeduct} />
          </div>

          <div className="calc-result">
            <div>
              Yearly surplus:{" "}
              <b>
                {sym}
                {money(khums.surplus)}
              </b>
            </div>
            <div className="big">
              Total Khums: {sym}
              {money(khums.total)}
            </div>
            <div>
              Sahm-e-Imam:{" "}
              <b>
                {sym}
                {money(khums.sahmImam)}
              </b>{" "}
              &nbsp; | &nbsp; Sahm-e-Sadat:{" "}
              <b>
                {sym}
                {money(khums.sahmSadat)}
              </b>
            </div>
          </div>
        </Section>

        {/* 4) QAZA NAMAZ */}
        <Section title="4) Qaza Namaz" subtitle="Count based">
          <div className="calc-grid">
            <Field label="Missed Days (prayers)" value={namazDays} setValue={setNamazDays} />
            <Field label={`Optional: Rate per prayer (${sym})`} value={namazRate} setValue={setNamazRate} />
          </div>

          {isSunni && (
            <div className="calc-row">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={includeWitr}
                  onChange={(e) => setIncludeWitr(e.target.checked)}
                />
                Include Witr (optional)
              </label>
            </div>
          )}

          <div className="calc-result">
            <div>
              Base prayers (5/day): <b>{qazaNamaz.base}</b>
            </div>
            {isSunni && includeWitr && (
              <div>
                Witr (1/day): <b>{qazaNamaz.witr}</b>
              </div>
            )}
            <div className="big">Total Qaza Namaz: {qazaNamaz.totalPrayers}</div>
            {n(namazRate) > 0 && (
              <div>
                Estimated amount:{" "}
                <b>
                  {sym}
                  {money(qazaNamaz.cost)}
                </b>
              </div>
            )}
          </div>
        </Section>

        {/* 5) QAZA ROZA */}
        <Section title="5) Qaza Roza" subtitle="Count based">
          <div className="calc-grid">
            <Field label="Missed Roza (days)" value={rozaDays} setValue={setRozaDays} />
            <Field label={`Optional: Rate per fast day (${sym})`} value={rozaRate} setValue={setRozaRate} />
          </div>

          <div className="calc-result">
            <div className="big">Total Qaza Roza: {qazaRoza.days} days</div>
            {n(rozaRate) > 0 && (
              <div>
                Estimated amount:{" "}
                <b>
                  {sym}
                  {money(qazaRoza.cost)}
                </b>
              </div>
            )}
          </div>
        </Section>

        {/* SUMMARY */}
        <div className="calc-section" style={{ marginTop: 16 }}>
          <div className="calc-section-head">
            Summary
            <small>
              {summary.includeZakat ? "Zakat" : "Zakat (not in total)"} + Fitrana +{" "}
              {summary.includeKhums ? "Khums" : "Khums (not in total)"} + optional estimates
            </small>
          </div>

          <div className="calc-section-body">
            <div className="calc-result">
              <div className="big">
                Grand Total: {sym}
                {money(summary.total)}
              </div>
              <div className="calc-note">
                Disclaimer: This tool provides practical estimates and counts. Final religious responsibility depends on
                your circumstances and scholar guidance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="calc-section">
      <div className="calc-section-head">
        <span>{title}</span>
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
      <div className="calc-section-body">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="calc-field">
      <label>
        <div className="lbl">{label}</div>
        <input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="0.01" />
      </label>
    </div>
  );
}
