// Services.tsx (FINAL - Additional amount is MANUAL by default)

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import type { Service, DonationItem } from "../types";
import { addToCart as saveToCart } from "../cart";

const SERVICES: Service[] = [
  /* =========================
     Tasbih & Duas
  ========================= */
  {
    id: "salawat",
    name: "Salawat Tasbih",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "istighfar",
    name: "Istighfar Tasbih",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "la-hawla-wa-la-quwwata",
    name: "La Hawla wa La Quwwata Tasbih",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "kalma-tawheed",
    name: "Kalmah Tawheed Tasbih",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "tasbih-zahra",
    name: "Tasbih Zahra",
    countLabel: "33+33+34",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "nade-ali",
    name: "Nade Ali",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "ya-rahman",
    name: "Ya Rahman",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },
  {
    id: "ya-shafi",
    name: "Ya Shafi",
    countLabel: "100x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Tasbih & Duas",
    icon: "/icons/tasbih.png",
  },

  /* =========================
     Qur’an & Surah Recitation
  ========================= */
  {
    id: "quran-complete",
    name: "Qur’an (Complete)",
    countLabel: "1x",
    priceGBP: 4,
    pricePKR: 1200,
    priceUSD: 5,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/quran.png",
  },
  {
    id: "ayat-e-karima",
    name: "Ayat-e-Karimah",
    countLabel: "1x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/ayat.png",
  },
  {
    id: "ayat-ul-kursi",
    name: "Ayat-ul-Kursi",
    countLabel: "1x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/ayat-ul-kursi.png",
  },
  {
    id: "4-qul",
    name: "4 Qul",
    countLabel: "1x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/4-qul.png",
  },
  {
    id: "surah-fatiha",
    name: "Surah Fatiha",
    countLabel: "1x",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/soorah-fateha.png",
  },
  {
    id: "surah-ikhlas",
    name: "Surah Ikhlas",
    countLabel: "1x",
    priceGBP: 3,
    pricePKR: 900,
    priceUSD: 4,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/soorah-ikhlas.png",
  },
  {
    id: "surah-mulk",
    name: "Surah Mulk",
    countLabel: "1x",
    priceGBP: 3,
    pricePKR: 900,
    priceUSD: 4,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/soorah-mulk.png",
  },
  {
    id: "surah-yaseen",
    name: "Surah Yaseen",
    countLabel: "1x",
    priceGBP: 3,
    pricePKR: 900,
    priceUSD: 4,
    category: "Qur’an & Surah Recitation",
    icon: "/icons/soorah-yaseen.png",
  },

  /* =========================
     Qaza Namaz
  ========================= */
  {
    id: "qaza-namaz-1day",
    name: "Qaza Namaz",
    countLabel: "1 day",
    priceGBP: 5,
    pricePKR: 1500,
    priceUSD: 6,
    category: "Qaza Namaz",
    icon: "/icons/namaz.png",
  },
  {
    id: "qaza-namaz-1year",
    name: "Qaza Namaz",
    countLabel: "1 year",
    priceGBP: 5,
    pricePKR: 1500,
    priceUSD: 6,
    category: "Qaza Namaz",
    icon: "/icons/namaz.png",
  },
  {
    id: "qaza-namaz-5year",
    name: "Qaza Namaz",
    countLabel: "5 year",
    priceGBP: 5,
    pricePKR: 1500,
    priceUSD: 6,
    category: "Qaza Namaz",
    icon: "/icons/namaz.png",
  },
  {
    id: "qaza-namaz-10year",
    name: "Qaza Namaz",
    countLabel: "10 year",
    priceGBP: 5,
    pricePKR: 1500,
    priceUSD: 6,
    category: "Qaza Namaz",
    icon: "/icons/namaz.png",
  },

  /* =========================
     Qaza Roza
  ========================= */
  {
    id: "qaza-roza-1day",
    name: "Qaza Roza",
    countLabel: "1 day",
    priceGBP: 2,
    pricePKR: 700,
    priceUSD: 3,
    category: "Qaza Roza",
    icon: "/icons/roza-1m.png",
  },
  {
    id: "qaza-roza-1month",
    name: "Qaza Roza",
    countLabel: "1 month",
    priceGBP: 45,
    pricePKR: 15000,
    priceUSD: 60,
    category: "Qaza Roza",
    icon: "/icons/roza-1m.png",
  },
  {
    id: "qaza-roza-1year",
    name: "Qaza Roza",
    countLabel: "1 year",
    priceGBP: 400,
    pricePKR: 130000,
    priceUSD: 550,
    category: "Qaza Roza",
    icon: "/icons/roza-1yrs.png",
  },

  /* =========================
     Additional Ziyārah & Special Services
     ✅ Cards remain, but amount/details are manual
  ========================= */
  {
    id: "dua-e-kheir",
    name: "Dua-e-Kheir",
    countLabel: "Manual",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Additional Ziyārah & Special Services",
    icon: "/icons/dua.png",
  },
  {
    id: "dua-e-kheir-karbala",
    name: "Dua-e-Kheir (Karbala & Ziyārah)",
    countLabel: "Manual",
    priceGBP: 2,
    pricePKR: 600,
    priceUSD: 3,
    category: "Additional Ziyārah & Special Services",
    icon: "/icons/dua1.png",
  },

  {
    id: "special-niaz",
    name: "Special Niaz",
    countLabel: "Manual",
    priceGBP: 5,
    pricePKR: 1500,
    priceUSD: 6,
    category: "Additional Ziyārah & Special Services",
    icon: "/icons/niaz.png",
  },
  {
    id: "khatam-special",
    name: "Khatam / Special Recitation",
    countLabel: "Manual",
    priceGBP: 8,
    pricePKR: 2500,
    priceUSD: 10,
    category: "Additional Ziyārah & Special Services",
    icon: "/icons/quran.png",
  },
];

const CATEGORY_ORDER: string[] = [
  "Tasbih & Duas",
  "Qur’an & Surah Recitation",
  "Qaza Namaz",
  "Qaza Roza",
  "Additional Ziyārah & Special Services",
];

type Currency = "GBP" | "PKR" | "USD";

export default function Services() {
  const [toast, setToast] = useState("");

  // ✅ Additional Manual Form state
  const [openAdditional, setOpenAdditional] = useState(false);
  const [baseService, setBaseService] = useState<Service | null>(null);

  const [reqTitle, setReqTitle] = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqCurrency, setReqCurrency] = useState<Currency>("GBP");
  const [reqAmount, setReqAmount] = useState<string>(""); // ✅ manual (empty by default)

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of SERVICES) {
      const cat = s.category ?? "Other";
      map.set(cat, [...(map.get(cat) ?? []), s]);
    }

    const ordered: [string, Service[]][] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = map.get(cat);
      if (items?.length) ordered.push([cat, items]);
    }
    for (const [cat, items] of map.entries()) {
      if (!CATEGORY_ORDER.includes(cat)) ordered.push([cat, items]);
    }
    return ordered;
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1200);
  }

  function isAdditional(service: Service) {
    return service.category === "Additional Ziyārah & Special Services";
  }

  function openAdditionalForm(service: Service) {
    setBaseService(service);
    setReqTitle(service.name);
    setReqLocation("");
    setReqNotes("");
    setReqCurrency("GBP");

    // ✅ IMPORTANT: manual amount (do NOT auto-fill with £2 etc.)
    setReqAmount("");

    setOpenAdditional(true);
  }

  function closeAdditionalForm() {
    setOpenAdditional(false);
    setBaseService(null);
  }

  function submitAdditional() {
    if (!baseService) return;

    const amount = Number(reqAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const item: DonationItem = {
      id: `additional-${baseService.id}-${Date.now()}`,
      name: reqTitle.trim() || baseService.name,
      priceGBP: 0,
      pricePKR: 0,
      priceUSD: 0,
      category: "Additional Custom",
      isDonation: true,

      donationGBP: reqCurrency === "GBP" ? amount : undefined,
      donationPKR: reqCurrency === "PKR" ? amount : undefined,
      donationUSD: reqCurrency === "USD" ? amount : undefined,

      location: reqLocation.trim() || undefined,
      notes: reqNotes.trim() || undefined,
    };

    saveToCart(item as any, 1);
    closeAdditionalForm();
    showToast(`${item.name} added to cart`);
  }

  function handleAdd(service: Service) {
    if (isAdditional(service)) {
      openAdditionalForm(service);
      return;
    }
    saveToCart(service, 1);
    showToast(`${service.name} added to cart`);
  }

  return (
    <div className="page">
      <div className="page-inner services-light">
        {/* PAGE HEADER */}
        <div className="services-top">
          <div>
            <h1 className="services-title">Services</h1>
            <p className="services-subtitle">
              Select a service and add it to your cart. Checkout when you are ready.
            </p>
          </div>

          <div className="services-top-actions">
            <Link to="/cart" className="btn btn-outline">
              View Cart
            </Link>
            <Link to="/checkout" className="btn btn-emerald">
              Checkout
            </Link>
          </div>
        </div>

        {/* TOAST */}
        {toast && <div className="toast">{toast}</div>}

        {/* SERVICE SECTIONS */}
        {grouped.map(([category, items], index) => (
          <React.Fragment key={category}>
            <section className="services-section">
              <div className="services-section-head">
                <h2>{category}</h2>
                <p className="muted">
                  Recitation of blessed prayers and remembrance for your loved ones
                </p>
              </div>

              <div className="services-grid">
                {items.map((service) => (
                  <ServiceCard key={service.id} service={service} onAdd={handleAdd} />
                ))}
              </div>
            </section>

            {index < grouped.length - 1 && <div className="services-divider" />}
          </React.Fragment>
        ))}

        {/* =========================
            ADDITIONAL MANUAL FORM MODAL
        ========================= */}
        {openAdditional && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
            onClick={closeAdditionalForm}
          >
            <div
              style={{
                width: "min(720px, 100%)",
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 18px 60px rgba(0,0,0,.25)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Additional Request</h2>
                  <p style={{ marginTop: 6, opacity: 0.7 }}>
                    Enter your custom details and amount. We will perform it manually as requested.
                  </p>
                </div>
                <button className="btn btn-outline" onClick={closeAdditionalForm}>
                  Close
                </button>
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <div>
                  <label className="muted">Request Title</label>
                  <input
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="input"
                    placeholder="e.g. Dua-e-Kheir in Karbala / Niaz / Khatam..."
                  />
                </div>

                <div>
                  <label className="muted">Location (optional)</label>
                  <select
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="input"
                  >
                    <option value="">Select location</option>
                    <option value="Karbala">Karbala</option>
                    <option value="Najaf">Najaf</option>
                    <option value="Makkah">Makkah</option>
                    <option value="Madinah">Madinah</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="muted">Details / Notes</label>
                  <textarea
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="Write names, relation (mother/father), intention, any message..."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="muted">Currency</label>
                    <select
                      value={reqCurrency}
                      onChange={(e) => {
                        const cur = e.target.value as Currency;
                        setReqCurrency(cur);

                        // ✅ keep amount manual when currency changes
                        setReqAmount("");
                      }}
                      className="input"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="PKR">PKR</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="muted">Amount</label>
                    <input
                      value={reqAmount}
                      onChange={(e) => setReqAmount(e.target.value)}
                      className="input"
                      inputMode="decimal"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-outline" onClick={closeAdditionalForm}>
                    Cancel
                  </button>
                  <button className="btn btn-emerald" onClick={submitAdditional}>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
