import React from "react";

export default function ProductCard({ product, onEdit, onDelete, compact = false }) {
  // ✅ CORRECCIÓN: Convertir a números y validar antes de calcular
  const precioCosto = Number(product.precio_costo) || 0;
  const precioVenta = Number(product.precio_venta) || 0;
  
  // Calcular margen de forma segura
  const margen = precioCosto > 0 
    ? ((precioVenta - precioCosto) / precioCosto * 100).toFixed(1)
    : '0.0';

  return (
    <div className={`product-card ${!product.activo ? 'product-card--inactive' : ''}`}>
      <div className="product-card__header">
        <div>
          <h3 className="product-card__name">{product.nombre || 'Sin nombre'}</h3>
          <span className="product-card__sku">SKU: {product.sku || 'N/A'}</span>
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
          <span className="pricing-value">Q{precioCosto.toFixed(2)}</span>
        </div>
        <div className="pricing-item">
          <span className="pricing-label">Venta</span>
          <span className="pricing-value pricing-value--sale">Q{precioVenta.toFixed(2)}</span>
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