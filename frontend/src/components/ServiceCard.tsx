import React from "react";
import type { Service } from "../types";

export default function ServiceCard({
  service,
  onAdd,
}: {
  service: Service;
  onAdd: (s: Service) => void;
}) {
  return (
    <div className="card">
      <div className="card-top">
        <div>
          <h3 className="card-title">{service.name}</h3>
          <p className="muted">{service.countLabel}</p>
        </div>

        <div className="price">
          <div>£{service.priceGBP.toFixed(2)}</div>
          <div className="muted">
            PKR {Math.round(service.pricePKR).toLocaleString()}
          </div>
          <div className="muted">
            ${service.priceUSD.toFixed(2)}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => onAdd(service)}>
        Add
      </button>
    </div>
  );
}
