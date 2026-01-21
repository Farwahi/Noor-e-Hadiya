import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Brand + Logo */}
        <div className="nav-brand">
          <img
            src="/logo.png"
            alt="Noor e Hadiya"
            className="nav-logo"
          />

          <Link to="/" className="brand">
            Noor-e-Hadiya
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/sadaqah">Sadaqah</NavLink>

          {/* ✅ NEW: Calculators */}
          <NavLink to="/calculators">Calculators</NavLink>

          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/checkout">Checkout</NavLink>
        </nav>
      </div>
    </header>
  );
}
