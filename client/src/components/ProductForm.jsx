// client/src/components/ProductForm.jsx
import React, { useState } from "react";

const CATEGORIAS = ["Ropa", "Calzado", "Equipos y Accesorios", "Gym"];

export default function ProductForm({ product, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    sku: product?.sku || "",
    nombre: product?.nombre || "",
    descripcion: product?.descripcion || "",
    categoria: product?.categoria || CATEGORIAS[0],
    proveedor_id: product?.proveedor_id || "",
    precio_costo: product?.precio_costo || "",
    precio_venta: product?.precio_venta || "",
    imagen_url: product?.imagen_url || "",
    activo: product?.activo ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (parseFloat(formData.precio_venta) < parseFloat(formData.precio_costo)) {
      setError("El precio de venta debe ser mayor al precio de costo");
      return;
    }

    setLoading(true);

    try {
      const base = import.meta.env.VITE_API_URL || "";
      const productData = {
        ...formData,
        precio_costo: parseFloat(formData.precio_costo),
        precio_venta: parseFloat(formData.precio_venta)
      };

      const url = product 
        ? `${base}/api/productos/${product.id}` 
        : `${base}/api/productos`;
      
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(productData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar");
      }

      alert(product ? "Producto actualizado correctamente" : "Producto creado correctamente");
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  // Calcular margen en tiempo real
  const margen = formData.precio_costo && formData.precio_venta
    ? (((formData.precio_venta - formData.precio_costo) / formData.precio_costo) * 100).toFixed(1)
    : 0;

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">SKU *</label>
          <input
            className="form-input"
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="PROD001"
            required
            disabled={!!product}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del Producto *</label>
          <input
            className="form-input"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Balón de fútbol"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descripción</label>
        <textarea
          className="form-textarea"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Descripción detallada del producto..."
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Categoría *</label>
          <select
            className="form-input"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
          >
            {CATEGORIAS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">ID Proveedor *</label>
          <input
            className="form-input"
            type="text"
            name="proveedor_id"
            value={formData.proveedor_id}
            onChange={handleChange}
            placeholder="0d48ac16-4e60-4e70-a17c-fcba03452e2e"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">URL de Imagen</label>
        <input
          className="form-input"
          type="text"
          name="imagen_url"
          value={formData.imagen_url}
          onChange={handleChange}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Precio Costo (Q) *</label>
          <input
            className="form-input"
            type="number"
            name="precio_costo"
            value={formData.precio_costo}
            onChange={handleChange}
            placeholder="100.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Precio Venta (Q) *</label>
          <input
            className="form-input"
            type="number"
            name="precio_venta"
            value={formData.precio_venta}
            onChange={handleChange}
            placeholder="120.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Margen</label>
          <div className="form-display">
            <span className="margin-badge">{margen}%</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input
            type="checkbox"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
          />
          <span>Producto activo</span>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Guardando..." : (product ? "Actualizar" : "Crear Producto")}
        </button>
      </div>
    </form>
  );
}