import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../style/pagoExitoso.css";

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

  const handleDescargarFactura = () => {
    // TODO: luego llamaremos a tu endpoint para generar/descargar el PDF
    alert("La descarga de factura estará disponible pronto.");
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

            <div className="success-info">
              <div className="info-row">
                <span className="info-label">ID de sesión</span>
                <span className="info-value">{sessionId}</span>
              </div>
              {/* Si luego quieres mostrar más datos (pedido, total, correo) los colocamos aquí */}
            </div>

            <div className="success-buttons">
              <button className="btn-pay" onClick={handleDescargarFactura}>
                Descargar factura
              </button>
              <Link className="btn-clear" to="/dashboard" replace="true">
                Ir al dashboard
              </Link>
              <Link className="btn-out" to="/products">
                Seguir comprando
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
