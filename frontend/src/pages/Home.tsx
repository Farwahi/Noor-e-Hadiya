import React, { useEffect, useMemo, useState } from "react";
import ServiceCard from "../components/ServiceCard";
import { Service } from "../types";
import { addToCart as saveToCart, getCart, clearCart, onCartChange } from "../cart";

const SERVICES: Service[] = [
  { id: "s1", name: "Salawat", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbeeh" },
  { id: "s2", name: "Istighfar", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbeeh" },
  { id: "s3", name: "Ayat-e-Karimah", countLabel: "100x", priceGBP: 2, pricePKR: 600, category: "Tasbeeh" },
  { id: "s4", name: "Tasbih-e-Fatimah", countLabel: "1x", priceGBP: 2, pricePKR: 600, category: "Tasbeeh" },

  { id: "s5", name: "Surah Yasin", countLabel: "1x", priceGBP: 3, pricePKR: 900, category: "Quran" },
  { id: "s6", name: "Surah Ikhlas", countLabel: "41x", priceGBP: 3, pricePKR: 900, category: "Quran" },
  { id: "s7", name: "Short Surahs", countLabel: "3x", priceGBP: 4, pricePKR: 1200, category: "Quran" },

  { id: "s8", name: "Qaza Namaz", countLabel: "1 year", priceGBP: 45, pricePKR: 15000, category: "Qaza" },
  { id: "s9", name: "Qaza Roza", countLabel: "1 year", priceGBP: 40, pricePKR: 13000, category: "Qaza" }
];

export default function Home() {
  // ✅ Load cart from localStorage at start
  const [cart, setCart] = useState<Service[]>(() => getCart());

  // ✅ Listen for cart changes (clearCart from Checkout, etc.)
  useEffect(() => {
    const unsub = onCartChange(() => setCart(getCart()));
    return unsub;
  }, []);

  // ✅ Group services by category
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of SERVICES) {
      map.set(s.category, [...(map.get(s.category) || []), s]);
    }
    return Array.from(map.entries());
  }, []);

  // ✅ Add service to cart (localStorage + UI)
  function handleAdd(s: Service) {
    saveToCart(s, 1);
    setCart(getCart()); // reload from localStorage to keep consistent
  }

  // ✅ Clear cart (localStorage + UI)
  function handleClear() {
    clearCart();
    setCart([]);
  }

  const totalGBP = useMemo(() => cart.reduce((sum, s) => sum + s.priceGBP, 0), [cart]);
  const totalPKR = useMemo(() => cart.reduce((sum, s) => sum + s.pricePKR, 0), [cart]);

  return (
    <div className="container">
      <div className="hero">
        <h1>Noor e Hadiya</h1>
        <p className="muted">Choose a recitation/amal service for your deceased loved ones.</p>
      </div>

      <div className="grid-2">
        {/* LEFT: Services */}
        <div>
          {grouped.map(([category, items]) => (
            <section key={category} className="section">
              <div className="section-head">
                <h2>{category}</h2>
              </div>

              <div className="cards">
                {items.map((s) => (
                  <ServiceCard key={s.id} service={s} onAdd={handleAdd} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT: Cart */}
        <aside className="sidebar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Your Cart</h3>

            {cart.length > 0 && (
              <button className="btn" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="muted">No items yet.</p>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map((c, idx) => (
                  <li key={`${c.id}-${idx}`}>
                    {c.name} <span className="muted">({c.countLabel})</span>
                  </li>
                ))}
              </ul>

              <div className="totals">
                <div>
                  <strong>Total:</strong> £{totalGBP.toFixed(2)}
                </div>
                <div className="muted">PKR {totalPKR.toFixed(0)}</div>
              </div>
            </>
          )}

          <a className="btn btn-primary" href="/checkout">
            Go to Checkout
          </a>
        </aside>
      </div>
    </div>
  );
}
