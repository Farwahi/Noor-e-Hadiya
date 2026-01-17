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
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notify();
}

export function addToCart(item: CartItem, qty = 1) {
  const cart = getCart();
  for (let i = 0; i < qty; i++) cart.push(item);
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
