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

    // === Estado de datos del cliente (para validar antes de pagar) ===
  const [clienteId, setClienteId] = useState(null);
  const [cliente, setCliente] = useState({
    correo: user?.correo || "",
    telefono: "",
    direccion_envio: "",
    direccion_facturacion: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsData = (c = cliente) => {
    return !String(c.telefono || "").trim()
        || !String(c.direccion_envio || "").trim()
        || !String(c.direccion_facturacion || "").trim();
  };


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

            // 2.5) traer datos del cliente por correo para prellenar
      try {
        const correo = encodeURIComponent(user?.correo || "");
        if (correo) {
          const rc = await fetch(`${api}/api/clientes/correo/${correo}`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          });
          if (rc.ok) {
            const arr = await rc.json();
            if (Array.isArray(arr) && arr.length) {
              const c = arr[0];
              setClienteId(c.id);
              setCliente({
                correo: c.correo || (user?.correo || ""),
                telefono: c.telefono || "",
                direccion_envio: c.direccion_envio || "",
                direccion_facturacion: c.direccion_facturacion || ""
              });
            } else {
              // no existe -> quedamos listos para crear
              setCliente(prev => ({ ...prev, correo: prev.correo || (user?.correo || "") }));
            }
          }
        }
      } catch { /* no bloquear */ }


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
    // === iniciar checkout en Stripe (se usa luego de guardar cliente) ===
  const startCheckout = async () => {
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
      window.location.href = data.url;
    } catch (e) {
      alert(e.message);
      setPaying(false);
    }
  };

  // === crear/actualizar cliente ===
  const saveCliente = async (goToPay = false) => {
    try {
      // validación mínima
      if (needsData(cliente)) {
        alert("Completa teléfono, dirección de envío y de facturación.");
        return;
      }
      setSaving(true);

      // construir payload
      const payload = {
        correo: cliente.correo || (user?.correo || ""),
        telefono: String(cliente.telefono || "").trim(),
        direccion_envio: String(cliente.direccion_envio || "").trim(),
        direccion_facturacion: String(cliente.direccion_facturacion || "").trim(),
      };

      let ok = false;
      let newId = clienteId;

      if (clienteId) {
        // UPDATE
        const r = await fetch(`${api}/api/clientes/update/${clienteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        ok = r.ok;
      } else {
        // CREATE (incluye usuario_id requerido por tu modelo)
        const r = await fetch(`${api}/api/clientes/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...payload, usuario_id: user?.id }),
        });
        ok = r.ok;
        if (ok) {
          const c = await r.json();
          newId = c?.id || null;
          setClienteId(newId);
        }
      }

      if (!ok) throw new Error("No se pudo guardar el cliente.");

      setShowForm(false);
      if (goToPay) await startCheckout();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };


  // === flujo de pagar: forzar datos de cliente antes ===
  const handlePay = async () => {
    // siempre obligamos a confirmar/actualizar datos
    setShowForm(true);
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
              {/* === Modal datos de cliente (obligatorio antes de pagar) === */}
      {showForm && (
        <div className="modal-mask">
          <div className="modal-card">
            <h3 style={{marginTop:0}}>Datos de envío y facturación</h3>

            <div className="form-grid">
              <label className="form-item">
                <span>Correo (solo lectura)</span>
                <input value={cliente.correo} readOnly className="inp" />
              </label>

              <label className="form-item">
                <span>Teléfono *</span>
                <input
                  className="inp"
                  value={cliente.telefono}
                  onChange={e=>setCliente(v=>({ ...v, telefono: e.target.value }))}
                  placeholder="Ej. +502 5555-6789"
                />
              </label>

              <label className="form-item wide">
                <span>Dirección de envío *</span>
                <textarea
                  className="inp"
                  rows={2}
                  value={cliente.direccion_envio}
                  onChange={e=>setCliente(v=>({ ...v, direccion_envio: e.target.value }))}
                  placeholder="Calle/Avenida, zona, municipio, departamento"
                />
              </label>

              <label className="form-item wide">
                <span>Dirección de facturación *</span>
                <textarea
                  className="inp"
                  rows={2}
                  value={cliente.direccion_facturacion}
                  onChange={e=>setCliente(v=>({ ...v, direccion_facturacion: e.target.value }))}
                  placeholder="Calle/Avenida, zona, municipio, departamento"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-out" onClick={()=>setShowForm(false)} disabled={saving || paying}>
                Cancelar
              </button>

              <button
                className="btn-clear"
                onClick={()=>saveCliente(false)}
                disabled={saving}
                title="Guardar sin pagar todavía"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>

              <button
                className="btn-pay"
                onClick={()=>saveCliente(true)}
                disabled={saving || paying}
                title="Guardar y continuar al pago"
              >
                {saving ? "Guardando…" : "Guardar y pagar"}
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
