// client/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import ProductList from "../components/ProductList";


export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productos, setProductos] = useState([]);
  const [q, setQ] = useState("");
  const CATS = ["Ropa", "Calzado", "Equipos y Accesorios", "Gym"];
  const [cat, setCat] = useState(null); // null = todas
  const authed = !!localStorage.getItem("token");

  
 // ===== Carrito (localStorage) =====
 const CART_KEY = "cart";
 const readCart = () => {
   try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
 };
 const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));
 const [cartCount, setCartCount] = useState(() => readCart().reduce((a,i)=>a+Number(i.qty||0),0));

useEffect(() => {
  const base = import.meta.env.VITE_API_URL || "";
  setLoading(true);
  setError("");

  // 1) Traer productos
  fetch(`${base}/api/productos`, {
    headers: { "Content-Type": "application/json" },
  })
    .then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "Error al cargar productos");
      const arr = Array.isArray(data) ? data : [];

      // 2) Para cada producto, traer su inventario y adjuntar existencias
      const withInv = await Promise.all(
        arr.map(async (p) => {
          try {
            const invRes = await fetch(`${base}/api/inventario/${p.id}`, {
              headers: { "Content-Type": "application/json" },
            });
            if (!invRes.ok) {
              // 404 u otro → sin inventario registrado
              return { ...p, existencia: 0 };
            }
            const inv = await invRes.json();
            return { ...p, existencia: Number(inv?.existencias ?? 0) };
          } catch {
            return { ...p, existencia: 0 };
          }
        })
      );

      setProductos(withInv);
    })
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}, []);


const filtrados = useMemo(() => {
  const term = q.trim().toLowerCase();
  return productos.filter((p) => {
    const porTexto = !term
      ? true
      : (p?.nombre || "").toLowerCase().includes(term) ||
        (p?.sku || "").toLowerCase().includes(term);

    const porCat = !cat ? true : (p?.categoria === cat);
    return porTexto && porCat;
  });
}, [productos, q, cat]);

const catCounts = useMemo(() => {
  const counts = Object.fromEntries(CATS.map(c => [c, 0]));
  for (const p of productos) {
    if (counts[p?.categoria] !== undefined) counts[p.categoria]++;
  }
  return counts;
}, [productos]);

  const fmtQ = (n) =>
    new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 2 }).format(
      Number(n || 0)
    );

  const navigate = useNavigate();
  const handleAddToCart = (p) => {
   const items = readCart();
   const idx = items.findIndex(it => (it.id ?? it.sku) === (p.id ?? p.sku));
   if (idx >= 0) {
     items[idx].qty = Number(items[idx].qty || 0) + 1;
   } else {
     items.push({
       id: p.id, sku: p.sku, nombre: p.nombre,
       precio: Number(p.precio_venta || 0),
       imagen_url: p.imagen_url || null,
       existencia: Number(p.existencia ?? 0),
       qty: 1
     });
   }
   saveCart(items);
   setCartCount(items.reduce((a,i)=>a+Number(i.qty||0),0));
 };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="dash">
      {/* Topbar */}
      <header className="dash-top">
        <div className="dash-brand">
          <span className="dot" />
          <h1>RabiSport</h1>
        </div>
        <div className="dash-user">
             <button className="btn-cart" title="Ver carrito" onClick={() => navigate("/carrito")}>
               🛒
               {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
             </button>
          {authed ? (
            <>
              <span className="hello">Hola, {user?.nombre_completo || user?.correo || "usuario"}</span>
              <button className="btn-out" onClick={logout}>Cerrar sesión</button>
            </>
          ) : (
            <button className="btn-out" onClick={() => (window.location.href = "/login")}>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="dash-main">
        {/* KPIs */}
        <section className="kpis cats">
  {CATS.map((c) => (
    <button
      key={c}
      type="button"
      className={`kpi kpi-cat ${cat === c ? "active" : ""}`}
      onClick={() => setCat(cat === c ? null : c)}
      title={`Ver ${c}`}
    >
      <div className="kpi-title">{c}</div>
      <div className="kpi-value">{catCounts[c] || 0}</div>
    </button>
  ))}
        </section>

        {/* Filtros */}
        <section className="toolbar">
          <input
            className="search"
            placeholder="Buscar por nombre o SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {cat && (
            <span className="chip" onClick={() => setCat(null)}>
              {cat} ×
            </span>
          )}

          <div className="right">
          <button 
            className="btn btn-primary"
            onClick={() => navigate("/products")}
            style={{ marginRight: '1rem' }}
          >
            📦 Registrar Producto
          </button>
          </div>
        </section>

        {/* Grid */}
        <section className="grid">
          {loading && <div className="info">Cargando productos…</div>}
          {!loading && error && <div className="error">⚠ {error}</div>}
          {!loading && !error && filtrados.length === 0 && (
            <div className="info">Sin resultados.</div>
          )}

          {!loading && !error &&
    filtrados.map((p) => {
      // ⬇️ p se define aquí como parámetro del map
      const imgUrl = p.imagen_url || `/products/${p.sku || p.id}.jpg`;

      return (
        <article key={p.id} className="card">
          <div
            className="thumb"
            style={{
              backgroundImage: `url(${imgUrl}), linear-gradient(135deg,#0b1620,#111a24)`,
            }}
            title={p.nombre}
          />
          <div className="card-body">
            <div className="row1">
              <h3 className="name">{p.nombre}</h3>
              <span className={`badge ${p.activo ? "ok" : "off"}`}>
                {p.activo ? "Disponible" : "Inactivo"}
              </span>
            </div>

            <div className="sku">SKU: {p.sku || "—"}</div>

            <div className="row2">
              <div className="price">
                <span className="lbl">Precio</span>
                <span className="val">{fmtQ(p.precio_venta)}</span>
              </div>
              <div className="price">
                <span className="lbl">Existencia</span>
                <span className="val">
                  {Number.isFinite(p.existencia) ? p.existencia : "—"}
                </span>
              </div>
            </div>

            <div className="prov">
              {p?.proveedore?.nombre || p?.proveedor?.nombre || "Sin proveedor"}
            </div>
           <button className="btn-buy" onClick={() => handleAddToCart(p)}>
             Añadir al carrito
           </button>
          </div>
        </article>
      );
    })}
</section>
      </main>

      {/* CSS */}
      <style>{`
        :root { color-scheme: dark; }
        .dash{
          min-height:100vh;
          background: radial-gradient(1200px 800px at 20% -10%, #12202b 0%, #0b1115 35%, #091016 100%);
          color:#e9f1f6;
        }

        /* Topbar */
        .dash-top{
          position: sticky; top:0; z-index:10;
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 22px; margin:12px; border-radius:14px;
          background: rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.06);
          backdrop-filter: blur(6px);
        }
        .dash-brand{ display:flex; align-items:center; gap:10px; }
        .dash-brand h1{ font-size:18px; margin:0; letter-spacing:.3px; }
        .dot{ width:10px; height:10px; border-radius:50%; background:#06b6d4; box-shadow:0 0 16px #06b6d4; }
        .dash-user{ display:flex; align-items:center; gap:10px; }
        .hello{ opacity:.9; font-size:14px; }
        .btn-out{
          background: transparent; border:1px solid rgba(255,255,255,.15);
          color:#dbe7ee; border-radius:10px; padding:8px 12px; cursor:pointer;
        }
        .btn-out:hover{ background: rgba(255,255,255,.06); }

        .dash-main{ padding: 12px 22px 32px; max-width:1900px; margin:0 auto; }

          /* ====== KPIs como filtros (4 columnas) ====== */
          .kpis.cats{
            display:grid;
            grid-template-columns: repeat(4, minmax(0,1fr));
            gap:12px; margin:14px 0;
          }

          .kpi{
            background: rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.06);
            backdrop-filter: blur(6px);
            border-radius:14px; padding:16px 18px;
          }
          .kpi-title{ font-size:12px; opacity:.8; margin-bottom:6px; }
          .kpi-value{ font-size:22px; font-weight:800; letter-spacing:.3px; }

          /* Botón de categoría: estado hover + activo */
          .kpi-cat{
            cursor:pointer;
            text-align:left;
            transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background-color .12s ease;
          }
          .kpi-cat:hover{
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.2);              /* más claro al pasar el mouse */
            border-color: rgba(33,193,209,.35);
            box-shadow: 0 10px 26px rgba(0,0,0,.25);
          }
          .kpi-cat.active{
            background: rgba(255,255,255,.08);              /* más claro cuando está activo */
            border-color: rgba(33,193,209,.65);
            box-shadow: 0 12px 28px rgba(33,193,209,.18);
          }

          /* Chip del filtro para limpiar (ya lo tenías, lo dejamos igual) */
          .chip{
            margin-left:10px;
            padding:6px 10px;
            border-radius:999px;
            background: rgba(255,255,255,.08);
            border:1px solid rgba(255,255,255,.12);
            font-size:12px;
            cursor:pointer;
          }
          .chip:hover{ background: rgba(255,255,255,.12); }

          /* ====== Tarjeta de producto: hover más claro ====== */
          .card{
            display:flex; flex-direction:column; overflow:hidden;
            border-radius:16px;
            background: rgba(255,255,255,.035);
            border:1px solid rgba(255,255,255,.06);
            transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease;
          }
          .card:hover{
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.13);              /* aclarar tarjeta al hover */
            border-color: rgba(255,255,255,.12);
            box-shadow: 0 20px 40px rgba(0,0,0,.35);
          }


        /* Toolbar */
        .toolbar{
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; margin:8px 0 14px;
        }
        .search{
          flex:1; padding:12px 14px; border-radius:12px;
          background: rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.08);
          color:#fff; outline:none; font-size:14px;
        }
        .search:focus{ border-color:#21c1d1; box-shadow:0 0 0 3px rgba(33,193,209,.18); }
        .toolbar .right{ display:flex; gap:10px; }

        /* Grid de cards */
        .grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:14px;
        }
        @media (max-width: 1200px){ .grid{ grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 900px){ .grid{ grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 580px){ .grid{ grid-template-columns: 1fr; } }

        .card{
          display:flex; flex-direction:column; overflow:hidden;
          border-radius:16px;
          background: rgba(255,255,255,.035);
          border:1px solid rgba(255,255,255,.06);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .card:hover{ transform: translateY(-2px); box-shadow: 0 20px 40px rgba(0,0,0,.35); }

        .thumb{
          width:100%; aspect-ratio: 11 / 10;
          background-size: cover; background-position: center;
          
        }
        .card-body{ padding:12px 14px 14px; display:flex; flex-direction:column; gap:8px; }
        .row1{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .name{ margin:0; font-size:16px; font-weight:700; letter-spacing:.2px; }
        .badge{
          font-size:11px; padding:4px 8px; border-radius:999px;
          border:1px solid rgba(255,255,255,.16);
        }
        .badge.ok{ background:rgba(21, 199, 151,.14); color:#aef8de; border-color:rgba(21,199,151,.28); }
        .badge.off{ background:rgba(199, 64, 64,.14); color:#ffd0d0; border-color:rgba(199,64,64,.28); }

        .sku{ opacity:.75; font-size:12px; }
        .row2{ display:flex; align-items:end; justify-content:space-between; gap:10px; }
        .price .lbl{ display:block; font-size:11px; opacity:.7; }
        .price .val{ font-size:15px; font-weight:800; }
        .price .val.muted{ opacity:.85; font-weight:700; }
        .prov{ font-size:12px; opacity:.8; }

        .btn-buy{
          margin-top:10px;
          width:100%;
          padding:10px 12px;
          border:none;
          border-radius:12px;
          cursor:pointer;
          font-weight:800;
          background: linear-gradient(90deg,#06b6d4,#0ea5a4);
          color:#041014;
        }
        .btn-buy:hover{ filter:brightness(1.05); }

        .info, .error{
          grid-column: 1 / -1;
          background: rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.06);
          border-radius:12px; padding:16px; text-align:center;
        }
        .error{ border-color: rgba(255, 135, 135, .35); color:#ffd0d0; }
        .btn-cart{
  position: relative;
  background: transparent;
  border: 1px solid rgba(255,255,255,.15);
  color:#dbe7ee;
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:16px;
}
.btn-cart:hover{ background: rgba(255,255,255,.06); }
.cart-badge{
  position:absolute; top:-6px; right:-6px;
  min-width:18px; height:18px; border-radius:999px;
  font-size:11px; font-weight:800; line-height:18px;
  text-align:center; background:#06b6d4; color:#041014;
  padding:0 4px;
}

      `}</style>
    </div>
  );
}
