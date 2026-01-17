import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Services from "./pages/Services";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Sadaqah from "./pages/Sadaqah";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/sadaqah" element={<Sadaqah />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* Footer appears on EVERY page */}
      <Footer />
    </div>
  );
}
