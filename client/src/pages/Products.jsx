// client/src/pages/Products.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductList from "../components/ProductList";
import ProductModal from "../components/ProductModal";

export default function Products() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActivo, setFilterActivo] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${base}/api/productos`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      
      // Cargar existencias para cada producto
      const withInv = await Promise.all(
        data.map(async (p) => {
          try {
            const invRes = await fetch(`${base}/api/inventario/${p.id}`, {
              headers: { "Content-Type": "application/json" },
            });
            if (!invRes.ok) return { ...p, existencia: 0 };
            const inv = await invRes.json();
            return { ...p, existencia: Number(inv?.existencias ?? 0) };
          } catch {
            return { ...p, existencia: 0 };
          }
        })
      );
      
      setProductos(withInv);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA GUARDAR (CREAR O EDITAR)
  const handleSaveProduct = async (formData) => {
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      
      // Determinar URL y método según si estamos editando o creando
      const isEditing = editingProduct !== null;
      const url = isEditing 
        ? `${base}/api/productos/create/${editingProduct.id}` 
        : `${base}/api/productos/update`;
      
      const method = isEditing ? "PUT" : "POST";

      console.log("=== DEBUG ===");
      console.log("Editando:", isEditing);
      console.log("URL:", url);
      console.log("Método:", method);
      console.log("Datos a enviar:", formData);

      // Nueva función genérica para manejar el guardado
      await handleSaveProductGeneric(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      // Cerrar modal y recargar
      setShowModal(false);
      setEditingProduct(null);
      await loadProducts();
      
      alert(isEditing 
        ? "✅ Producto actualizado correctamente" 
        : "✅ Producto creado exitosamente"
      );

    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error al guardar el producto:\n${error.message}`);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${base}/api/productos/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      await loadProducts();
      alert("✅ Producto eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al eliminar producto");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // Filtrar productos
  const filteredProducts = productos.filter(p => {
    const matchSearch = (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterActivo === "all" || 
                       (filterActivo === "active" && p.activo) ||
                       (filterActivo === "inactive" && !p.activo);
    return matchSearch && matchFilter;
  });

  if (loading) {
    return <div className="products-loading">Cargando productos...</div>;
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>{productos.length} productos en total</p>
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
            + Nuevo Producto
          </button>
        </div>
      </header>

      <div className="products-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterActivo}
          onChange={(e) => setFilterActivo(e.target.value)}
        >
          <option value="all">Todos los productos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      <ProductList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        compact={false}
      />

      {showModal && (
        <ProductModal
          show={showModal}
          product={editingProduct}
          onClose={handleModalClose}
          onSave={handleSaveProduct} // ✅ ESTO ES LO QUE FALTABA
        />
      )}
    </div>
  );
}

// Ejemplo genérico para handleSaveProduct (POST/PUT)
async function handleSaveProductGeneric(url, options) {
  try {
    const res = await fetch(url, options);

    // leer texto primero para poder mostrar HTML o JSON legible en errores
    const responseText = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    // Información útil para debug en consola
    console.log("Respuesta status:", res.status);
    console.log("content-type:", contentType);
    console.log("body (preview):", responseText.slice(0, 1000));

    if (!res.ok) {
      // si viene JSON, intentar parsear el message; si viene HTML, incluirlo en el error
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
      // si el backend responde con texto plano, devuélvelo
      return responseText;
    }
  } catch (err) {
    console.error("handleSaveProduct error:", err);
    throw err; // propaga para que el caller lo muestre
  }
}