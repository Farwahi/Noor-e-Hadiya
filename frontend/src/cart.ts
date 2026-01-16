// frontend/src/cart.ts
import type { Service } from "../src/types";

const CART_KEY = "noor_e_hadiya_cart";
const CART_EVENT = "noor_e_hadiya_cart_updated";

function notify() {
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): Service[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as Service[]) : [];
  } catch {
    return [];
  }
}

export function setCart(items: Service[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notify();
}

export function addToCart(service: Service, qty = 1) {
  const cart = getCart();
  for (let i = 0; i < qty; i++) cart.push(service);
  setCart(cart); // notify() happens inside setCart
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  notify();
}

// ✅ optional helper for pages to listen
export function onCartChange(handler: () => void) {
  window.addEventListener(CART_EVENT, handler);
  return () => window.removeEventListener(CART_EVENT, handler);
}
