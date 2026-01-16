import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Noor e Hadiya
        </Link>

        <nav className="nav-links">
           <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Services
          </NavLink>
           <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Sadaqah
          </NavLink>
           <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>
           <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Contact
          </NavLink>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Cart
          </NavLink>
          <NavLink
            to="/checkout"
            className={({ isActive }) => (isActive ? "active" : "")}>
            Checkout
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
