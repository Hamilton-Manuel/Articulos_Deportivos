// client/src/components/ProductCard.jsx
import React from "react";

export default function ProductCard({ product, onEdit, onDelete, compact = false }) {
  const margen = ((product.precio_venta - product.precio_costo) / product.precio_costo * 100).toFixed(1);

  return (
    <div className={`product-card ${!product.activo ? 'product-card--inactive' : ''}`}>
      <div className="product-card__header">
        <div>
          <h3 className="product-card__name">{product.nombre}</h3>
          <span className="product-card__sku">SKU: {product.sku}</span>
        </div>
        <span className={`product-badge ${product.activo ? 'badge-active' : 'badge-inactive'}`}>
          {product.activo ? '✓ Activo' : '⏸ Inactivo'}
        </span>
      </div>

      {!compact && product.descripcion && (
        <p className="product-card__description">{product.descripcion}</p>
      )}

      {product.categoria && (
        <span className="product-category">{product.categoria}</span>
      )}

      <div className="product-card__pricing">
        <div className="pricing-item">
          <span className="pricing-label">Costo</span>
          <span className="pricing-value">Q{product.precio_costo.toFixed(2)}</span>
        </div>
        <div className="pricing-item">
          <span className="pricing-label">Venta</span>
          <span className="pricing-value pricing-value--sale">Q{product.precio_venta.toFixed(2)}</span>
        </div>
        <div className="pricing-item">
          <span className="pricing-label">Margen</span>
          <span className="pricing-value pricing-value--margin">{margen}%</span>
        </div>
      </div>

      {onEdit && onDelete && (
        <div className="product-card__actions">
          <button
            className="btn-icon btn-icon--edit"
            onClick={() => onEdit(product)}
            title="Editar"
          >
            ✏️
          </button>
          <button
            className="btn-icon btn-icon--delete"
            onClick={() => onDelete(product.id)}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}