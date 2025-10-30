// client/src/components/ProductList.jsx
import React from "react";
import ProductCard from "./ProductCard";

export default function ProductList({ products, onEdit, onDelete, compact = false }) {
  if (products.length === 0) {
    return (
      <div className="product-list-empty">
        <p>📦 No hay productos para mostrar</p>
      </div>
    );
  }

  return (
    <div className={`product-list ${compact ? 'product-list--compact' : ''}`}>
      {products.map(product => (
        <ProductCard
          key={product.id || product.sku}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          compact={compact}
        />
      ))}
    </div>
  );
}