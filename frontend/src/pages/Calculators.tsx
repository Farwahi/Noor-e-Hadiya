import React from "react";
import { Link } from "react-router-dom";
import AllInOneIslamicCalculator from "../components/AllInOneIslamicCalculator";

export default function Calculators() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          ← Back
        </Link>
        <h2 style={{ margin: 0 }}>Islamic Calculators</h2>
      </div>

      <p style={{ marginTop: 0, color: "rgba(16,24,40,.75)" }}>
        Use these calculators for estimates (Sunni & Shia options included). Final religious responsibility depends on
        your circumstances and scholar guidance.
      </p>

      <AllInOneIslamicCalculator />
    </div>
  );
}
