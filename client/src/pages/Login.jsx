// client/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import bg from "../images/rabisport.jpg";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/Dashboard", { replace: true });
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5173";
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Credenciales inválidas");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/Dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
    }
  };

  return (
    <div className="auth-layout" style={{ ["--auth-bg"]: `url(${bg})` }}>
      {/* Panel visual */}
      <aside className="auth-hero">
        <div className="auth-hero__content">
          <h1 className="brand-glow">RabiSport</h1>
          <p>Gestión de artículos deportivos con pagos seguros.</p>

          {/* Chips de confianza */}
          <div className="hero-badges">
            <div className="badge">
              <span className="ico" aria-hidden>🔒</span>
              Pago seguro
            </div>
            <div className="badge">
              <span className="ico" aria-hidden>🚚</span>
              Envíos a todo el país
            </div>
            <div className="badge">
              <span className="ico" aria-hidden>💬</span>
              Soporte 24/7
            </div>
          </div>

          {/* Cifras rápidas */}
          <div className="hero-stats">
            <div className="stat">
              <strong>500+</strong>
              <span>Productos</span>
            </div>
            <div className="stat">
              <strong>1200+</strong>
              <span>Clientes</span>
            </div>
            <div className="stat">
              <strong>4.9★</strong>
              <span>Valoración</span>
            </div>
            <div className="stat">
              <strong>48h</strong>
              <span>Entrega</span>
            </div>
          </div>

          {/* “Marcas” (placeholder) */}
          <div className="hero-brands" aria-label="Marcas aliadas">
            <span>ProFit</span>
            <span>RunnerX</span>
            <span>GymPro</span>
            <span>Sportify</span>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <header className="auth-card__header">
            <h2>Iniciar sesión</h2>
            <p>Bienvenido de nuevo 👋</p>
          </header>

          <label className="auth-label">Correo</label>
          <input
            className="auth-input"
            type="email"
            placeholder="ingresa tu correo "
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <label className="auth-label">Contraseña</label>
          <input
            className="auth-input"
            type="password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit">Entrar</button>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/Register">Regístrate</Link>
          </p>

          <footer className="auth-foot">
            <small>© {new Date().getFullYear()} RabiSport</small>
          </footer>
        </form>
      </main>

      {/* Bloque informativo inferior: Quiénes somos / Misión / Visión / Por qué RabiSport */}
      <section className="site-info">
        <div className="info-grid">
          <article className="info-card">
            <h3>¿Quiénes somos?</h3>
            <p>
              Somos una tienda deportiva enfocada en ofrecer productos de alto
              rendimiento y una experiencia de compra simple y segura.
            </p>
          </article>
          <article className="info-card">
            <h3>Misión</h3>
            <p>
              Impulsar el deporte con equipamiento confiable, precios justos y
              atención cercana a cada cliente.
            </p>
          </article>
          <article className="info-card">
            <h3>Visión</h3>
            <p>
              Ser la plataforma líder en artículos deportivos en Guatemala, con
              entregas rápidas y soporte excepcional.
            </p>
          </article>
          <article className="info-card">
            <h3>¿Por qué RabiSport?</h3>
            <ul className="why-list">
              <li>Catálogo variado y actualizado</li>
              <li>Pagos encriptados y protegidos</li>
              <li>Garantía y devoluciones fáciles</li>
              <li>Asesoría experta</li>
            </ul>
          </article>
        </div>
      </section>

      {/* ===== CSS embebido (sólo estilos) ===== */}
      <style>{`
        /* ===== Fondo global ===== */
        .auth-layout{
          position: relative;
          min-height:100vh;
          display:grid;
          grid-template-columns: 1fr;
          overflow-x: hidden;
          isolation:isolate;
        }
        .auth-layout::before{
          content:"";
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(8,12,16,.55), rgba(8,12,16,.55)), var(--auth-bg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index:-2;
        }
        /* Blob suave decorativo */
        .auth-layout::after{
          content:"";
          position: fixed;
          width: 60vmax; height: 60vmax;
          left: -20vmax; top: -20vmax;
          background: radial-gradient(closest-side, rgba(6,182,212,.22), transparent 70%);
          filter: blur(40px);
          z-index:-1;
          pointer-events:none;
          animation: floatBlob 16s ease-in-out infinite alternate;
        }
        @keyframes floatBlob {
          from { transform: translate(0,0) rotate(0deg); }
          to   { transform: translate(12%,8%) rotate(12deg); }
        }

        @media (min-width: 1024px){
          .auth-layout{ grid-template-columns: 520px 1fr; }
        }

        /* ===== Panel visual ===== */
        .auth-hero{
          display:flex; align-items:center; justify-content:center;
          padding:48px 28px;
          order:2;
          color:#eaf2f6;
          text-shadow: 0 2px 18px rgba(0,0,0,.45);
        }
        @media (min-width: 1024px){ .auth-hero{ order:2; } }

        .auth-hero__content{
          text-align:center; max-width:880px; width:100%;
          display:flex; flex-direction:column; gap:18px;
        }

        /* Título con brillo dinámico */
        .brand-glow{
          margin:0 0 4px 0;
          font-size: clamp(28px, 4vw, 46px);
          letter-spacing:.3px;
          background: linear-gradient(90deg, #f8fafc, #c7f9ff, #35e0db, #f8fafc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shine 8s linear infinite;
        }
        @keyframes shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .auth-hero__content p{
          margin:0; font-size: clamp(14px, 1.8vw, 18px); opacity:.92;
        }

        /* Badges de confianza */
        .hero-badges{
          display:flex; gap:12px; justify-content:center; flex-wrap:wrap;
          margin-top:6px;
        }
        .badge{
          display:inline-flex; align-items:center; gap:8px;
          padding:8px 12px;
          background: rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:999px;
          backdrop-filter: blur(6px);
          font-size:13px; color:#e8f5f8;
        }
        .badge .ico{ font-size:16px; }

        /* Cifras rápidas */
        .hero-stats{
          display:grid; grid-template-columns: repeat(4, minmax(0,1fr));
          gap:10px; margin-top:6px;
        }
        @media (max-width:720px){ .hero-stats{ grid-template-columns: repeat(2,1fr); } }
        .stat{
          background: rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;
          padding:12px;
          display:flex; flex-direction:column; gap:2px;
          backdrop-filter: blur(4px);
        }
        .stat strong{ font-size:18px; color:#ffffff; }
        .stat span{ font-size:12px; color:#b9c9d4; }

        /* Pseudo-marcas */
        .hero-brands{
          display:flex; gap:18px; justify-content:center; flex-wrap:wrap;
          opacity:.9; font-size:12px; color:#c2d6de; margin-top:2px;
        }
        .hero-brands span{
          padding:6px 10px; border-radius:10px;
          background: rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);
        }

        /* ===== Columna formulario ===== */
        .auth-main{
          display:flex; align-items:center; justify-content:center;
          padding:28px; order:1;
        }
        @media (min-width: 1024px){ .auth-main{ order:1; } }

        /* Tarjeta */
        .auth-card{
          width:100%; max-width:520px;
          background: rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(8px);
          border-radius:18px;
          padding:42px;
          color:#dbe7ee;
          display:flex; flex-direction:column; gap:12px;
          box-shadow: 0 20px 60px rgba(0,0,0,.55);
          position:relative; overflow:hidden;
        }
        .auth-card::after{
          content:"";
          position:absolute; inset:auto -20% -60% -20%;
          height:120%; background: radial-gradient(closest-side, rgba(6,182,212,.18), transparent 70%);
          filter: blur(40px);
          pointer-events:none;
        }
        @media (max-width: 520px){ .auth-card{ padding:28px; } }
        .auth-card__header h2{
          margin:0 0 4px 0; font-size:28px; color:#f2f7fa;
        }
        .auth-card__header p{
          margin:0; font-size:14px; color:#a9bac6;
        }

        /* Inputs */
        .auth-label{ font-size:13px; color:#cfe0ea; margin-top:6px; }
        .auth-input{
          width:100%; padding:12px 14px; border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(7,12,16,.62);
          color:#fff; font-size:15px; outline:none;
          transition: box-shadow .2s, border-color .2s, transform .05s;
        }
        .auth-input:focus{
          border-color:#21c1d1; box-shadow:0 0 0 3px rgba(33,193,209,.18);
          transform: translateY(-1px);
        }

        /* Botón */
        .auth-btn{
          margin-top:8px; padding:12px; border-radius:12px; border:none;
          background: linear-gradient(90deg,#06b6d4,#0ea5a4);
          color:#041014; font-weight:800; font-size:15px; cursor:pointer; width:100%;
          transition: transform .06s ease, filter .2s;
        }
        .auth-btn:hover{ filter:brightness(1.06); transform: translateY(-1px); }
        .auth-btn:active{ transform: translateY(0); }

        /* Error & enlaces */
        .auth-error{ color:#ff8b8b; text-align:center; font-size:14px; margin-top:6px; }
        .auth-link{ margin-top: 1rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
        .auth-link a{ color:#4ECDC4; font-weight:500; text-decoration:none; transition: color .2s; }
        .auth-link a:hover{ color:#3ab5ad; text-decoration:underline; }
        .auth-foot{ margin-top:4px; text-align:center; color:#9cb2c0; }

        /* ===== Bloque informativo inferior ===== */
        .site-info{
          grid-column: 1 / -1;
          padding: 28px 22px 40px;
        }
        .info-grid{
          max-width: 1200px; margin: 0 auto;
          display:grid; gap:14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px){
          .info-grid{ grid-template-columns: repeat(4,1fr); }
        }
        .info-card{
          background: rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:16px;
          padding:18px 16px;
          color:#eaf2f6;
          backdrop-filter: blur(6px);
          min-height: 140px;
        }
        .info-card h3{
          margin:0 0 8px 0; font-size:16px; color:#f2f7fa; letter-spacing:.2px;
        }
        .info-card p{ margin:0; font-size:14px; color:#cfe0ea; line-height:1.6; }
        .why-list{ margin:0; padding-left: 18px; color:#cfe0ea; font-size:14px; }
        .why-list li{ margin:4px 0; }
      `}</style>
    </div>
  );
}
