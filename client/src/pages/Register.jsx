import { useState } from "react";   
import { useNavigate, Link } from "react-router-dom";
import bg from "../images/rabisport.jpg";

export default function Register() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // intenta usar la URL de entorno, si no existe usa el backend en :8081
      const base = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const payload = {
        correo: correo,
        hash_contrasena: contrasena,
        nombre_completo: nombre,
        rol: "CLIENTE",
        activo: true,
      };

      const res = await fetch(`${base}/api/usuarios/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // mostrar mensaje retornado por backend o genérico
        return setError(data.message || data.error || "Error al registrar usuario");
      }

      setSuccess("Usuario creado correctamente. Redirigiendo a login...");
      // esperar 1s para que el usuario vea el mensaje y luego ir a login
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div
      className="auth-layout"
      style={{ ["--auth-bg"]: `url(${bg})` }}
    >
      <aside className="auth-hero">
        <div className="auth-hero__content">
          <h1>RabiSport</h1>
          <p>Crea tu cuenta para gestionar compras y pedidos.</p>
        </div>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <header className="auth-card__header">
            <h2>Regístrate</h2>
            <p>Crear una cuenta nueva</p>
          </header>

          <label className="auth-label">Correo</label>
          <input
            className="auth-input"
            type="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <label className="auth-label">Nombre completo</label>
          <input
            className="auth-input"
            type="text"
            placeholder="Nombre y apellidos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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

          <button className="auth-btn" type="submit">Crear cuenta</button>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button className="auth-link" type="button">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </button>

          <footer className="auth-foot">
            <small>© {new Date().getFullYear()} RabiSport</small>
          </footer>
        </form>
      </main>

      <style>{`
        /* Reutiliza estilos definidos en Login.jsx. Si en el futuro centralizas, muévelos a un CSS compartido */
        .auth-layout{ position: relative; min-height:100vh; display:grid; grid-template-columns: 1fr; }
        .auth-layout::before{ content:""; position: fixed; inset: 0; background-image: linear-gradient(rgba(8,12,16,.55), rgba(8,12,16,.55)), var(--auth-bg); background-size: cover; background-position: center; background-repeat: no-repeat; z-index: -1; }
        @media (min-width: 1024px){ .auth-layout{ grid-template-columns: 520px 1fr; } }
        .auth-hero{ display:flex; align-items:center; justify-content:center; padding:48px 28px; order:2; color:#eaf2f6; text-shadow: 0 2px 18px rgba(0,0,0,.45); }
        .auth-hero__content{ text-align:center; max-width:720px; }
        .auth-hero__content h1{ margin:0 0 8px 0; font-size: clamp(28px, 4vw, 46px); }
        .auth-main{ display:flex; align-items:center; justify-content:center; padding:28px; order:1; }
        .auth-card{ width:100%; max-width:520px; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); backdrop-filter: blur(6px); border-radius:16px; padding:42px; color:#dbe7ee; display:flex; flex-direction:column; gap:12px; box-shadow: 0 20px 50px rgba(0,0,0,.55); }
        .auth-card__header h2{ margin:0 0 4px 0; font-size:28px; color:#f2f7fa; }
        .auth-label{ font-size:13px; color:#cfe0ea; margin-top:6px; }
        .auth-input{ width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(255,255,255,.1); background: rgba(7,12,16,.6); color:#fff; font-size:15px; outline:none; }
        .auth-input:focus{ border-color:#21c1d1; box-shadow:0 0 0 3px rgba(33,193,209,.15); }
        .auth-btn{ margin-top:8px; padding:12px; border-radius:12px; border:none; background: linear-gradient(90deg,#06b6d4,#0ea5a4); color:#041014; font-weight:800; font-size:15px; cursor:pointer; width:100%; }
        .auth-btn:hover{ filter:brightness(1.05); }
        .auth-link { margin-top: 1rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
        .auth-link a { color: #4ECDC4; font-weight: 500; text-decoration: none; transition: color 0.2s; }
        .auth-link a:hover { color: #3ab5ad; text-decoration: underline; }
        .auth-error{ color:#ff8b8b; text-align:center; font-size:14px; margin-top:6px; }
        .auth-success{ color:#b7f5dd; text-align:center; font-size:14px; margin-top:6px; }
        .auth-foot{ margin-top:4px; text-align:center; color:#9cb2c0; }
      `}</style>
    </div>
  );
}


