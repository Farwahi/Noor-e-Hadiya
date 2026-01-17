import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import type { Service } from "../types";
import { addToCart as saveToCart } from "../cart";

const SERVICES: Service[] = [
  // Tasbih & Short Duas
  { id: "s1", name: "Salawat", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbih & Short Duas" },
  { id: "s2", name: "Istighfar", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbih & Short Duas" },
  { id: "s3", name: "Ayat-e-Karimah", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbih & Short Duas" },
  { id: "s4", name: "Tasbih-e-Fatimah", countLabel: "33+33+34", priceGBP: 2, pricePKR: 600, category: "Tasbih & Short Duas" },

  // Qur’an Recitation
  { id: "s5", name: "Surah Yasin", countLabel: "1x", priceGBP: 3, pricePKR: 900, category: "Qur’an Recitation" },
  { id: "s6", name: "Surah Ikhlas", countLabel: "41x", priceGBP: 3, pricePKR: 900, category: "Qur’an Recitation" },
  { id: "s7", name: "Short Surahs", countLabel: "3x", priceGBP: 4, pricePKR: 1200, category: "Qur’an Recitation" },
  { id: "s8", name: "Short Ayahs", countLabel: "3x", priceGBP: 4, pricePKR: 1200, category: "Qur’an Recitation" },

  // Qaza
  { id: "s9", name: "Qaza Namaz", countLabel: "1 year", priceGBP: 45, pricePKR: 15000, category: "Qaza" },
  { id: "s10", name: "Qaza Namaz", countLabel: "10 years", priceGBP: 40, pricePKR: 13000, category: "Qaza" },
  { id: "s11", name: "Qaza Roza", countLabel: "1 month", priceGBP: 45, pricePKR: 15000, category: "Qaza" },
  { id: "s12", name: "Qaza Roza", countLabel: "1 year", priceGBP: 40, pricePKR: 13000, category: "Qaza" },
];

export default function Services() {
  const [toast, setToast] = useState("");

  // Group services by category (safe for optional category)
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of SERVICES) {
      const cat = s.category ?? "Other";
      map.set(cat, [...(map.get(cat) ?? []), s]);
    }
    return Array.from(map.entries());
  }, []);

  function handleAdd(service: Service) {
    saveToCart(service, 1);
    setToast(`${service.name} added to cart`);
    window.setTimeout(() => setToast(""), 1200);
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
            <Link to="/cart" className="btn btn-outline">View Cart</Link>
            <Link to="/checkout" className="btn btn-emerald">Checkout</Link>
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
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </section>

            {/* ✅ DIVIDER BETWEEN CATEGORIES */}
            {index < grouped.length - 1 && (
              <div className="services-divider" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
