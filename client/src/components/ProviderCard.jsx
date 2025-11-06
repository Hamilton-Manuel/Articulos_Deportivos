import React from 'react';

export default function ProviderCard({ proveedor, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{proveedor.nombre}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(proveedor)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(proveedor.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Contacto:</span>
          <span>{proveedor.contacto}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold">Teléfono:</span>
          <span>{proveedor.telefono}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold">Correo:</span>
          <a href={`mailto:${proveedor.correo}`} className="text-blue-500 hover:underline">
            {proveedor.correo}
          </a>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="font-semibold">Dirección:</span>
          <span className="flex-1">{proveedor.direccion}</span>
        </div>
        
        {proveedor.creado_en && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <span>Registrado:</span>
            <span>{new Date(proveedor.creado_en).toLocaleDateString('es-GT')}</span>
          </div>
        )}
      </div>
    </div>
  );
}