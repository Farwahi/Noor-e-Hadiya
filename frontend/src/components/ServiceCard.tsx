import React from "react";
import type { Service } from "../types";

export default function ServiceCard({
  service,
  onAdd,
}: {
  service: Service;
  onAdd: (s: Service) => void;
}) {
  const iconSrc = service.icon || "/icons/quran.png"; // fallback

  return (
    <div className="card service-card">
      <div className="service-card-top">
        <div className="service-card-left">
          <div>
            <h3 className="card-title">{service.name}</h3>
            {service.countLabel && <p className="muted">{service.countLabel}</p>}
          </div>
        </div>

        {/* Icon on the RIGHT (like your screenshot) */}
        <div className="service-icon service-icon-right">
          <img src={iconSrc} alt={service.name} />
        </div>
      </div>

      <div className="service-divider" />

      {/* Prices (ALL currencies) */}
      <div className="service-prices">
        <div className="service-price-gbp">
          £{service.priceGBP.toFixed(2)}
        </div>

        <div className="service-price-sep">|</div>

        <div className="service-price-muted">
          PKR {Math.round(service.pricePKR).toLocaleString()}
        </div>

        <div className="service-price-sep">|</div>

        <div className="service-price-muted">
          ${service.priceUSD.toFixed(2)}
        </div>
      </div>

      <button
        className="btn btn-primary service-add-btn"
        onClick={() => onAdd(service)}
      >
        Add
      </button>
    </div>
  );
}
