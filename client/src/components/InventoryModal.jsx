import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../style/Inventory.css";

export default function Inventory() {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(null);
  const navigate = useNavigate();
  const [cantidadRestar, setCantidadRestar] = useState('');


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

      // Obtener inventario de cada producto
      const withInventory = await Promise.all(
        data.map(async (p) => {
          try {
            const invRes = await fetch(`${base}/api/inventario/${p.id}`, {
              headers: { "Content-Type": "application/json" },
            });
            
            if (!invRes.ok) {
              return { 
                ...p, 
                existencias: 0, 
                minimo: 5,
                cantidadAgregar: 0
              };
            }
            
            const inv = await invRes.json();
            return { 
              ...p, 
              existencias: Number(inv?.existencias ?? 0),
              minimo: Number(inv?.minimo ?? 5),
              cantidadAgregar: 0
            };
          } catch {
            return { 
              ...p, 
              existencias: 0, 
              minimo: 5,
              cantidadAgregar: 0
            };
          }
        })
      );

      setProductos(withInventory);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (productId, value) => {
    setProductos(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, cantidadAgregar: Math.max(0, Number(value) || 0) }
        : p
    ));
  };

  const handleAgregarInventario = async (producto) => {
    if (producto.cantidadAgregar <= 0) {
      alert("⚠️ Debes ingresar una cantidad mayor a 0");
      return;
    }

    try {
      setSaving(producto.id);
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      
      const nuevaExistencia = producto.existencias + producto.cantidadAgregar;
      
      const res = await fetch(`${base}/api/inventario/update/${producto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          producto_id: producto.id,
          existencias: nuevaExistencia,
          minimo: producto.minimo
        })
      });

      if (!res.ok) throw new Error("Error al actualizar inventario");

      // Actualizar el estado local
      setProductos(prev => prev.map(p => 
        p.id === producto.id 
          ? { 
              ...p, 
              existencias: nuevaExistencia,
              cantidadAgregar: "0"
            }
          : p
      ));

      alert(`✅ Se agregaron ${producto.cantidadAgregar} unidades a "${producto.nombre}"`);
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al actualizar inventario");
    } finally {
      setSaving(null);
    }
  };

  const filteredProducts = productos.filter(p =>
    (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="products-loading">Cargando inventario...</div>;
  }

  return (

    <div className="products-page">
      <header className="products-header">
        <div>
          <h1>📊 Gestión de Inventario</h1>
          <p>{productos.length} productos en total</p>
        </div>
        <div className="products-header__actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            ← Volver al Dashboard
          </button>
        </div>
        {showModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Modificar Existencia</h2>
      <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
        Producto: <strong>{productoSeleccionado?.nombre}</strong>
      </p>

                <input
            type="number"
            className="modal-input"
            placeholder="Cantidad a restar"
            value={cantidadRestar}
            onChange={(e) => setCantidadRestar(e.target.value)}
            min="0"
            />

      <div className="modal-actions">
        <button 
          className="modal-btn cancel"
          onClick={() => setShowModal(false)}
        >
          Cancelar
        </button>
        <button 
  className="modal-btn confirm"
  onClick={async () => {
    if (!cantidadRestar || cantidadRestar <= 0) {
      alert('⚠️ Ingrese una cantidad válida');
      return;
    }

    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";

      // Calcula la nueva existencia restando la cantidad indicada
      const nuevaExistencia = Math.max(
        (productoSeleccionado.existencias || 0) - parseInt(cantidadRestar, 10),
        0
      );

      const response = await fetch(`${base}/api/inventario/update/${productoSeleccionado.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          producto_id: productoSeleccionado.id,
          existencias: nuevaExistencia,
          minimo: productoSeleccionado.minimo
        })
      });

      if (!response.ok) throw new Error("Error al actualizar inventario");

      alert('✅ Inventario actualizado correctamente');
      setShowModal(false);
      setCantidadRestar('');

      // 🔁 Refresca la lista principal (usa tu función real)
      if (typeof loadProducts === 'function') {
        await loadProducts();
      }

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión con el servidor');
    }
  }}
>
  Confirmar
</button>

      </div>
    </div>
  </div>
)}

      </header>

      <div className="products-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="products-empty">
          <div className="products-empty__icon">📦</div>
          <h3>No se encontraron productos</h3>
          <p>Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((producto) => {
            const imgUrl = producto.imagen_url || `/products/${producto.sku || producto.id}.jpg`;
            const stockBajo = producto.existencias < producto.minimo;

            return (
              <div key={producto.id} className="product-card">
                <div
                  className="product-card__image"
                  style={{
                    backgroundImage: `url(${imgUrl}), linear-gradient(135deg,#0b1620,#111a24)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '200px',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
                
                <div className="product-card__body" style={{ padding: '1rem' }}>
                  <h3 className="product-card__title">{producto.nombre}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    SKU: {producto.sku}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: stockBajo ? '#fff3cd' : '#e8f5e9',
                    borderRadius: '6px'
                  }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Stock Actual</div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold',
                        color: stockBajo ? '#d32f2f' : '#2e7d32'
                      }}>
                        {producto.existencias}
                      </div>
                      {stockBajo && (
                        <div style={{ fontSize: '0.7rem', color: '#d32f2f' }}>
                          ⚠️ Bajo stock
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Mínimo</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666' }}>
                        {producto.minimo}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      marginBottom: '0.5rem' 
                    }}>
                      Cantidad a agregar:
                    </label>
                    <input
                      type="number"
                      min=""
                      value={producto.cantidadAgregar}
                      onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                      className="form-input"
                      placeholder=""
                      style={{ width: '100%', textAlign: 'center' }}
                    />
                  </div>

                  <button
                    onClick={() => handleAgregarInventario(producto)}
                    disabled={saving === producto.id || producto.cantidadAgregar <= 0}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%',
                      opacity: (saving === producto.id || producto.cantidadAgregar <= 0) ? 0.5 : 1
                    }}
                  >
                    {saving === producto.id ? '⏳ Guardando...' : '✓ Agregar al Inventario'}
                  </button>
                    <button
                    className="btn btn-outline"
                    style={{ width: '100%', marginTop: '0.6rem' }}
                    onClick={() => {
                        setProductoSeleccionado(producto);
                        setShowModal(true);
                    }}
                    >
                    ✏️ Modificar Existencia
                    </button>
                    

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}