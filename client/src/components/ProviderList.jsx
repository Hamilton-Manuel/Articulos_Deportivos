import React from 'react';

export default function ProviderList({ proveedores, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="products-loading">
        <div className="spinner"></div>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div className="products-empty">
        <div className="products-empty__icon">📦</div>
        <h3>No hay proveedores registrados</h3>
        <p>Comienza agregando tu primer proveedor haciendo clic en "Nuevo Proveedor"</p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {proveedores.map((proveedor) => (
        <div key={proveedor.id} className="product-card">
          <div className="product-card__header">
            <h3 className="product-card__title">{proveedor.nombre}</h3>
            <div className="product-card__actions">
              <button
                onClick={() => onEdit(proveedor)}
                className="btn btn-sm btn-primary"
                title="Editar proveedor"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(proveedor.id)}
                className="btn btn-sm btn-danger"
                title="Eliminar proveedor"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="product-card__body">
            <div className="product-info">
              <div className="product-info__item">
                <span className="label">👤 Contacto:</span>
                <span className="value">{proveedor.contacto}</span>
              </div>

              <div className="product-info__item">
                <span className="label">📞 Teléfono:</span>
                <span className="value">{proveedor.telefono}</span>
              </div>

              <div className="product-info__item">
                <span className="label">✉️ Correo:</span>
                <a 
                  href={`mailto:${proveedor.correo}`} 
                  className="value link"
                >
                  {proveedor.correo}
                </a>
              </div>

              <div className="product-info__item">
                <span className="label">📍 Dirección:</span>
                <span className="value">{proveedor.direccion}</span>
              </div>

              {proveedor.creado_en && (
                <div className="product-info__item">
                  <span className="label">📅 Registrado:</span>
                  <span className="value">
                    {new Date(proveedor.creado_en).toLocaleDateString('es-GT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}