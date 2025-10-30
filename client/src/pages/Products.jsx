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
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/productos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      await loadProducts();
      alert("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar producto");
    }
  };

  const handleModalClose = async (shouldRefresh) => {
    setShowModal(false);
    setEditingProduct(null);
    if (shouldRefresh) {
      await loadProducts();
    }
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
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}