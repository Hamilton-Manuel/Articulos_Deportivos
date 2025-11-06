import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderList from '../components/ProviderList';
import ProviderForm from '../components/ProviderForm';

export default function Providers() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    loadProviders();
  }, [navigate]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${base}/api/proveedores`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      
      if (!res.ok) throw new Error("Error al cargar proveedores");
      const data = await res.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA GUARDAR (CREAR O EDITAR)
  const handleSaveProvider = async (formData) => {
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      
      // Determinar URL y método según si estamos editando o creando
      const isEditing = editingProvider !== null;
      const url = isEditing 
        ? `${base}/api/proveedores/Update/${editingProvider.id}` 
        : `${base}/api/proveedores/create/`;
      
      const method = isEditing ? "PUT" : "POST";

      console.log("=== DEBUG PROVIDER ===");
      console.log("Editando:", isEditing);
      console.log("URL:", url);
      console.log("Método:", method);
      console.log("Datos a enviar:", formData);

      // Función genérica para manejar el guardado
      await handleSaveProviderGeneric(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      // Cerrar modal y recargar
      setShowModal(false);
      setEditingProvider(null);
      await loadProviders();
      
      alert(isEditing 
        ? "✅ Proveedor actualizado correctamente" 
        : "✅ Proveedor creado exitosamente"
      );

    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error al guardar el proveedor:\n${error.message}`);
    }
  };

  const handleCreate = () => {
    setEditingProvider(null);
    setShowModal(true);
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este proveedor?")) return;
    
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${base}/api/proveedores/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      await loadProviders();
      alert("✅ Proveedor eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al eliminar proveedor");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  // Filtrar proveedores
  const filteredProviders = proveedores.filter(p => {
    const matchSearch = (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.contacto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.correo || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  if (loading) {
    return <div className="products-loading">Cargando proveedores...</div>;
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <div>
          <h1>Gestión de Proveedores</h1>
          <p>{proveedores.length} proveedores en total</p>
        </div>
        <div className="products-header__actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            ← Volver al Dashboard
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCreate}
          >
            + Nuevo Proveedor
          </button>
        </div>
      </header>

      <div className="products-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar por nombre, contacto o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ProviderList
        proveedores={filteredProviders}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={false}
      />

      {showModal && (
        <ProviderForm
          proveedor={editingProvider}
          onSave={handleSaveProvider}
          onCancel={handleModalClose}
        />
      )}
    </div>
  );
}

// Función genérica para handleSaveProvider (POST/PUT)
async function handleSaveProviderGeneric(url, options) {
  try {
    const res = await fetch(url, options);

    // Leer texto primero para poder mostrar HTML o JSON legible en errores
    const responseText = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    // Información útil para debug en consola
    console.log("Respuesta status:", res.status);
    console.log("content-type:", contentType);
    console.log("body (preview):", responseText.slice(0, 1000));

    if (!res.ok) {
      // Si viene JSON, intentar parsear el message; si viene HTML, incluirlo en el error
      if (contentType.includes("application/json")) {
        const errObj = JSON.parse(responseText);
        throw new Error(errObj.message || JSON.stringify(errObj));
      } else {
        // HTML u otro -> muestra el texto (o primeras líneas)
        throw new Error(`Server error ${res.status}: ${responseText.substring(0, 500)}`);
      }
    }

    // Éxito: parsear si es JSON, o devolver texto si no
    if (contentType.includes("application/json")) {
      return JSON.parse(responseText);
    } else {
      // Si el backend responde con texto plano, devuélvelo
      return responseText;
    }
  } catch (err) {
    console.error("handleSaveProvider error:", err);
    throw err; // propaga para que el caller lo muestre
  }
}