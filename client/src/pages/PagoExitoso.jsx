import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../style/PagoExitoso.css";

export default function PagoExitoso() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const sessionId = new URLSearchParams(search).get("session_id");

  useEffect(() => {
    if (!sessionId) return; // si no hay sesión, NO limpies ni redirijas

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?.id || "guest";

    const CART_KEY = `cart_${uid}`;
    const PEDIDO_KEY = `pedido_${uid}`;

    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(PEDIDO_KEY);
    localStorage.setItem("last_payment_cleared", String(Date.now()));
  }, [sessionId]);

const handleDescargarFactura = async () => {
  if (!sessionId) {
    alert("No se detectó session_id de Stripe.");
    return;
  }
  const api = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("token") || "";

  try {
    const url = `${api}/api/facturas/session/${encodeURIComponent(sessionId)}.pdf`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.message || "No se pudo generar la factura.");
    }
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Factura_${sessionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert(e.message);
  }
};


  return (
    <div className="success-shell">
      <div className="success-bg" />

      {/* Topbar compacto como en carrito */}
      <div className="success-top">
        <div className="success-brand">
          <span className="dot" />
          <h1>RabiSports</h1>
        </div>
        <div className="success-actions">
          <button className="btn-out" onClick={() => navigate("/dashboard", { replace: true })}>
            Ir al dashboard
          </button>
        </div>
      </div>

      <main className="success-page">
        {sessionId ? (
          <section className="success-card">
            <div className="success-header">
              <div className="success-icon">✅</div>
              <div>
                <h2 className="success-title">¡Pago exitoso!</h2>
                <p className="success-sub">Tu pedido ha sido confirmado y el carrito fue limpiado.</p>
              </div>
            </div>


            <div className="success-buttons">
              <button className="btn-pay" onClick={handleDescargarFactura}>
                Descargar factura
              </button>
              <Link className="btn-clear" to="/dashboard" replace="true">
                Ir al dashboard
              </Link>
              <Link className="btn-out btn-home" to="/dashboard" replace aria-label="Ir al dashboard">
                <svg
                  className="ico-home"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="32"
                  height="32"
                  style={{ marginRight: 8 }}
                >
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 10v10h5v-6h4v6h5V10" />
                </svg>
              </Link>

            </div>
          </section>
        ) : (
          <section className="success-card">
            <div className="success-header">
              <div className="success-icon">ℹ️</div>
              <div>
                <h2 className="success-title">Sin pago válido</h2>
                <p className="success-sub">No se detectó una sesión de pago. Vuelve al carrito para intentarlo.</p>
              </div>
            </div>

            <div className="success-buttons">
              <Link className="btn-clear" to="/carrito">Ir al carrito</Link>
              <Link className="btn-out" to="/dashboard">Ir al dashboard</Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
