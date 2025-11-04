// client/src/pages/Carrito.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/carrito.css";

export default function Carrito() {
  const navigate = useNavigate();

  const didRun = useRef(false);
  const api   = import.meta.env.VITE_API_URL || "";
  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const uid   = user?.id || "guest";
  const token = localStorage.getItem("token") || "";

  // Si no hay sesión, redirige a login
  if (!token) {
    window.location.href = "/login";
    return null;
  }

  const CART_KEY = `cart_${uid}`;
  const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } };
  const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

  const [items, setItems] = useState(readCart());
  const [pedidoId, setPedidoId] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    (async () => {
      // 1) sincronizar carrito local -> backend
      const local = readCart();
      const bodyItems = local.map(i => ({ producto_id: i.id, cantidad: i.qty }));

      await fetch(`${api}/api/pedidos/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: bodyItems })
      }).catch(()=>{});

      // 2) leer pedido abierto (encabezado + detalle)
      const r = await fetch(`${api}/api/pedidos/open`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (r.status === 401) { window.location.href = "/login"; return; }
      const data = await r.json();

      // guarda id del encabezado del pedido
      setPedidoId(data?.id || data?.pedido?.id || null);

      // 3) mapear items del server
      if (Array.isArray(data?.items)) {
        const mapped = data.items.map(it => ({
          id: it.producto_id,
          sku: it.producto?.sku || "—",
          nombre: it.producto?.nombre || "Producto",
          precio: Number(it.producto?.precio_venta || 0),
          qty: Number(it.cantidad || 0),
          imagen_url: null
        }));
        setItems(mapped);
        saveCart(mapped);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () => items.reduce((a,i)=> a + Number(i.precio||0)*Number(i.qty||0), 0),
    [items]
  );

  const setAndSave = (arr) => { setItems(arr); saveCart(arr); };
  const inc  = (id) => setAndSave(items.map(i => i.id===id ? {...i, qty:Number(i.qty||0)+1} : i));
  const dec  = (id) => setAndSave(items.map(i => i.id===id ? {...i, qty:Math.max(1, Number(i.qty||0)-1)} : i));
  const del  = (id) => setAndSave(items.filter(i => i.id!==id));
  const clear= () => setAndSave([]);

  // === pagar con stripe ===
  const handlePay = async () => {
    if (!pedidoId) { alert("No hay un pedido abierto para pagar."); return; }
    try {
      setPaying(true);
      const res = await fetch(`${api}/api/pagos/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pedido_id: pedidoId })
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.message || "No se pudo iniciar el pago.");
      window.location.href = data.url; // redirige a Stripe
    } catch (e) {
      alert(e.message);
      setPaying(false);
    }
  };

  return (
    <div className="cart-shell">
      <div className="cart-bg" />

      {/* === Topbar (igual al dashboard) === */}
      <header className="cart-top">
        <div className="cart-brand">
          <span className="dot" />
          <h1>RabiSport</h1>
        </div>
        <div className="cart-top-actions">
          <button className="btn-out" onClick={() => navigate(-1)} title="Regresar">← Volver</button>
          <button className="btn-out" onClick={() => navigate("/dashboard")} title="Ir al inicio">Inicio</button>
        </div>
      </header>

      <main className="cart-page">
        <h2 className="cart-title">Carrito</h2>

        {items.length === 0 ? (
          <div className="cart-empty">Tu carrito está vacío.</div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th align="left">Producto</th>
                  <th className="num">Precio</th>
                  <th className="num">Cant.</th>
                  <th className="num">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="cart-item">
                    <td data-label="Producto">
                      <div className="cart-prod">
                        {i.imagen_url && <img className="cart-thumb" src={i.imagen_url} alt={i.nombre} />}
                        <div>
                          <div className="cart-name">{i.nombre}</div>
                          <div className="cart-sku">SKU: {i.sku || "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="num price" data-label="Precio">
                      {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format(i.precio||0)}
                    </td>

                    <td className="num" data-label="Cantidad">
                      <div className="qty" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                        <button className="btn-qty" onClick={()=>dec(i.id)} aria-label="Disminuir">−</button>
                        <span className="qty-val">{i.qty}</span>
                        <button className="btn-qty" onClick={()=>inc(i.id)} aria-label="Aumentar">+</button>
                      </div>
                    </td>

                    <td className="num price" data-label="Subtotal">
                      {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format((i.precio||0)*(i.qty||0))}
                    </td>

                    <td className="num" data-label="Acciones">
                      <button className="btn-link" onClick={()=>del(i.id)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-actions">
              <button className="btn-clear" onClick={clear}>Vaciar carrito</button>

              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div className="cart-total">
                  Total:{" "}
                  <span className="price">
                    {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format(total)}
                  </span>
                </div>

                <button
                  className="btn-pay"
                  onClick={handlePay}
                  disabled={!pedidoId || paying}
                  title={!pedidoId ? "No hay pedido abierto" : "Pagar con Stripe"}
                >
                  {paying ? "Redirigiendo…" : "Pagar"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
