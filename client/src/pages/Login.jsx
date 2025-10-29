// client/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../images/rabisport.jpg";


export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

    useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
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
    <div
      className="auth-layout"
      style={{ ["--auth-bg"]: `url(${bg})` }} // variable CSS para el fondo global
    >
      {/* Panel visual (derecha en desktop, sin fondo propio) */}
      <aside className="auth-hero">
        <div className="auth-hero__content">
          <h1>RabiSport</h1>
          <p>Gestión de artículos deportivos con pagos seguros.</p>
        </div>
      </aside>

      {/* Formulario (izquierda en desktop) */}
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
          <footer className="auth-foot">
            <small>© {new Date().getFullYear()} RabiSport</small>
          </footer>
        </form>
      </main>

      {/* CSS embebido */}
      <style>{`
        /* ===== Fondo global a pantalla completa ===== */
        .auth-layout{
          position: relative;
          min-height:100vh;
          display:grid;
          grid-template-columns: 1fr;          /* móvil: 1 columna */
        }
        /* capa fija con imagen + overlay que cubre todo el viewport */
        .auth-layout::before{
          content:"";
          position: fixed;  /* permanece fijo al hacer scroll */
          inset: 0;
          background-image: linear-gradient(rgba(8,12,16,.55), rgba(8,12,16,.55)), var(--auth-bg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: -1;      /* detrás del contenido */
        }
        @media (min-width: 1024px){
          .auth-layout{
            grid-template-columns: 520px 1fr;  /* desktop: 2 columnas */
          }
        }

        /* ===== Panel visual (texto sobre el fondo global) ===== */
        .auth-hero{
          display:flex;
          align-items:center;
          justify-content:center;
          padding:48px 28px;
          order:2;                 /* móvil debajo */
          color:#eaf2f6;
          text-shadow: 0 2px 18px rgba(0,0,0,.45);
        }
        @media (min-width: 1024px){
          .auth-hero{ order:2; }   /* desktop derecha */
        }
        .auth-hero__content{
          text-align:center;
          max-width:720px;
        }
        .auth-hero__content h1{
          margin:0 0 8px 0;
          font-size: clamp(28px, 4vw, 46px);
          letter-spacing:.3px;
        }
        .auth-hero__content p{
          margin:0;
          font-size: clamp(14px, 1.8vw, 18px);
          opacity:.92;
        }

        /* ===== Columna del formulario ===== */
        .auth-main{
          display:flex;
          align-items:center;
          justify-content:center;
          padding:28px;
          order:1;
        }
        @media (min-width: 1024px){
          .auth-main{ order:1; }
        }

        /* ===== Tarjeta ===== */
        .auth-card{
          width:100%;
          max-width:520px;
          background: rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
          border-radius:16px;
          padding:42px;
          color:#dbe7ee;
          display:flex;
          flex-direction:column;
          gap:12px;
          box-shadow: 0 20px 50px rgba(0,0,0,.55);
        }
        @media (max-width: 520px){
          .auth-card{ padding:28px; }
        }
        .auth-card__header h2{
          margin:0 0 4px 0;
          font-size:28px;
          color:#f2f7fa;
        }
        .auth-card__header p{
          margin:0;
          font-size:14px;
          color:#a9bac6;
        }

        /* ===== Inputs ===== */
        .auth-label{
          font-size:13px;
          color:#cfe0ea;
          margin-top:6px;
        }
        .auth-input{
          width:100%;
          padding:12px 14px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.1);
          background: rgba(7,12,16,.6);
          color:#fff;
          font-size:15px;
          outline:none;
        }
        .auth-input:focus{
          border-color:#21c1d1;
          box-shadow:0 0 0 3px rgba(33,193,209,.15);
        }

        /* ===== Botón ===== */
        .auth-btn{
          margin-top:8px;
          padding:12px;
          border-radius:12px;
          border:none;
          background: linear-gradient(90deg,#06b6d4,#0ea5a4);
          color:#041014;
          font-weight:800;
          font-size:15px;
          cursor:pointer;
          width:100%;
        }
        .auth-btn:hover{
          filter:brightness(1.05);
        }

        /* ===== Error & pie ===== */
        .auth-error{
          color:#ff8b8b;
          text-align:center;
          font-size:14px;
          margin-top:6px;
        }
        .auth-foot{
          margin-top:4px;
          text-align:center;
          color:#9cb2c0;
        }
      `}</style>
    </div>
  );
}
