import React, { useState, useEffect } from 'react';

export default function ProviderForm({ proveedor, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        correo: proveedor.correo || '',
        direccion: proveedor.direccion || ''
      });
    }
  }, [proveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del proveedor es requerido';
    }

    if (!formData.contacto.trim()) {
      newErrors.contacto = 'El nombre de contacto es requerido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button 
            className="modal-close"
            onClick={onCancel}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Nombre del Proveedor <span className="required">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`form-input ${errors.nombre ? 'error' : ''}`}
              placeholder="Ej: Sportiva S.A."
            />
            {errors.nombre && (
              <span className="form-error">{errors.nombre}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Nombre de Contacto <span className="required">*</span>
            </label>
            <input
              type="text"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
              className={`form-input ${errors.contacto ? 'error' : ''}`}
              placeholder="Ej: María López"
            />
            {errors.contacto && (
              <span className="form-error">{errors.contacto}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Teléfono <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`form-input ${errors.telefono ? 'error' : ''}`}
                placeholder="Ej: +502 5555-1234"
              />
              {errors.telefono && (
                <span className="form-error">{errors.telefono}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Correo Electrónico <span className="required">*</span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`form-input ${errors.correo ? 'error' : ''}`}
                placeholder="Ej: compras@sportiva.com"
              />
              {errors.correo && (
                <span className="form-error">{errors.correo}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Dirección <span className="required">*</span>
            </label>
            <textarea
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              rows="3"
              className={`form-input ${errors.direccion ? 'error' : ''}`}
              placeholder="Ej: 6a Av. 4-55 Zona 10, Ciudad de Guatemala"
            />
            {errors.direccion && (
              <span className="form-error">{errors.direccion}</span>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {proveedor ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}