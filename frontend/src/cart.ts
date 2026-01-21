// src/cart.ts
import type { CartItem } from "./types";

const CART_KEY = "noor_e_hadiya_cart";
const CART_EVENT = "noor_e_hadiya_cart_updated";

function notify() {
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  if (!items || items.length === 0) {
    localStorage.removeItem(CART_KEY);
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
  notify();
}

export function addToCart(item: CartItem, qty = 1) {
  const cart = getCart();
  const n = Math.max(1, Number(qty) || 1);
  for (let i = 0; i < n; i++) cart.push(item);
  setCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  notify();
}

export function onCartChange(handler: () => void) {
  window.addEventListener(CART_EVENT, handler);
  return () => window.removeEventListener(CART_EVENT, handler);
}
