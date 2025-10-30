// client/src/components/StatsCard.jsx
import React from "react";

export default function StatsCard({ title, value, icon, color = "blue" }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__content">
        <h3 className="stats-card__title">{title}</h3>
        <p className="stats-card__value">{value}</p>
      </div>
    </div>
  );
}