// client/src/pages/Usuarios.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Usuarios.css";

export default function Usuarios() {
  const navigate = useNavigate();
  const strAPI = import.meta.env.VITE_API_URL || "";
  const strToken = localStorage.getItem("token") || "";
  const objUser = JSON.parse(localStorage.getItem("user") || "{}");

  // --- Estados UI ---
  const [boolLoading, setBoolLoading] = useState(false);
  const [strMsg, setStrMsg] = useState("");
  const [arrUsuarios, setArrUsuarios] = useState([]);
  const [strQ, setStrQ] = useState("");

  // --- Formulario ---
  const frmInit = {
    id: "",
    correo: "",
    nombre_completo: "",
    rol: "CLIENTE",
    activo: true,
    contrasena: "",       // entrada visible (sin hash)
    confirmar: "",        // confirmación
  };
  const [frmUsuario, setFrmUsuario] = useState({ ...frmInit });
  const [boolEditando, setBoolEditando] = useState(false);
  const [boolHashLocal, setBoolHashLocal] = useState(true); // hashear con SHA-256 en el cliente

  const headersJSON = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: strToken ? `Bearer ${strToken}` : "",
    }),
    [strToken]
  );

  // --- Guard de rol (solo ADMIN/EMPLEADO pueden ver este módulo) ---
  if (!objUser?.rol || (objUser.rol !== "ADMIN" && objUser.rol !== "EMPLEADO")) {
    return <div style={{ padding: 16 }}>Acceso denegado.</div>;
  }

  const shortId = (s = "") => (s ? s.slice(0, 8) + "…" : "");

  // --- Util: SHA-256 a hex (WebCrypto) ---
  const sha256Hex = async (str) => {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // --- Cargar todos ---
  const fnFetchAll = async () => {
    try {
      setBoolLoading(true);
      setStrMsg("");
      const r = await fetch(`${strAPI}/api/usuarios`, { headers: headersJSON });
      if (r.status === 401) {
        setStrMsg("Sesión expirada. Inicia sesión.");
        navigate("/login");
        return;
      }
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();
      setArrUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setStrMsg(`Error al cargar: ${e.message}`);
    } finally {
      setBoolLoading(false);
    }
  };

  useEffect(() => {
    fnFetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Búsqueda local (también existe /correo/:correo si prefieres) ---
  const arrFiltrados = useMemo(() => {
    const q = strQ.trim().toLowerCase();
    if (!q) return arrUsuarios;
    return arrUsuarios.filter((u) => {
      const c1 = (u.correo || "").toLowerCase();
      const c2 = (u.nombre_completo || "").toLowerCase();
      const c3 = (u.rol || "").toLowerCase();
      return c1.includes(q) || c2.includes(q) || c3.includes(q);
    });
  }, [arrUsuarios, strQ]);

  // --- Handlers ---
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFrmUsuario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fnNuevo = () => {
    setFrmUsuario({ ...frmInit });
    setBoolEditando(false);
    setStrMsg("");
  };

  const fnEditar = (obj) => {
    setFrmUsuario({
      id: obj.id || "",
      correo: obj.correo || "",
      nombre_completo: obj.nombre_completo || "",
      rol: obj.rol || "CLIENTE",
      activo: Boolean(obj.activo),
      contrasena: "",
      confirmar: "",
    });
    setBoolEditando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fnEliminar = async (id) => {
    if (!id) return;
    const ok = window.confirm("¿Eliminar este usuario?");
    if (!ok) return;

    try {
      setBoolLoading(true);
      setStrMsg("");
      const r = await fetch(`${strAPI}/api/usuarios/delete/${id}`, {
        method: "DELETE",
        headers: headersJSON,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Error ${r.status}`);
      }
      setStrMsg("Usuario eliminado.");
      await fnFetchAll();
      if (frmUsuario.id === id) fnNuevo();
    } catch (e) {
      setStrMsg(`No se pudo eliminar: ${e.message}`);
    } finally {
      setBoolLoading(false);
    }
  };

  // --- Validación mínima ---
  const fnValidar = (esUpdate) => {
    if (!frmUsuario.correo.trim() || !frmUsuario.nombre_completo.trim()) {
      setStrMsg("correo y nombre_completo son obligatorios.");
      return false;
    }
    if (!esUpdate) {
      if (!frmUsuario.contrasena.trim()) {
        setStrMsg("La contraseña es obligatoria al crear.");
        return false;
      }
    }
    if (frmUsuario.contrasena || frmUsuario.confirmar) {
      if (frmUsuario.contrasena !== frmUsuario.confirmar) {
        setStrMsg("La contraseña y su confirmación no coinciden.");
        return false;
      }
    }
    return true;
  };

  // --- Guardar (Create/Update) ---
  const fnGuardar = async (e) => {
    e.preventDefault();
    const esUpdate = Boolean(frmUsuario.id);
    if (!fnValidar(esUpdate)) return;

    try {
      setBoolLoading(true);
      setStrMsg("");

      // Construir payload
      const payload = {
        correo: frmUsuario.correo.trim(),
        nombre_completo: frmUsuario.nombre_completo.trim(),
        rol: frmUsuario.rol,
        activo: Boolean(frmUsuario.activo),
      };

      // Crear o reset de contraseña si se proporcionó
      if (!esUpdate || (frmUsuario.contrasena && frmUsuario.confirmar)) {
        const plain = frmUsuario.contrasena || "";
        payload.hash_contrasena = boolHashLocal ? await sha256Hex(plain) : plain;
      }

      const url = esUpdate
        ? `${strAPI}/api/usuarios/update/${frmUsuario.id}`
        : `${strAPI}/api/usuarios/create`;
      const method = esUpdate ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: headersJSON,
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Error ${r.status}`);
      }

      setStrMsg(esUpdate ? "Usuario actualizado." : "Usuario creado.");
      await fnFetchAll();
      if (!esUpdate) fnNuevo();
    } catch (e2) {
      // Unicidad de correo u otros errores
      setStrMsg(`No se pudo guardar: ${e2.message}`);
    } finally {
      setBoolLoading(false);
    }
  };

 return (
   <div className="usuarios-shell">
     <div className="usuarios-main">
       <div className="usuarios-page">
<div className="u-head">
  <h2 className="usuarios-title">Usuarios</h2>

  <div className="u-head-actions">
    <button
      type="button"
      className="btn"
      onClick={() => navigate(-1)}
      title="Regresar"
    >
      ← Regresar
    </button>

    <button
      type="button"
      className="btn btn-primary"
      onClick={() => navigate("/")} // cambia a "/dashboard" si aplica
      title="Ir al dashboard"
    >
      {/* Icono de casa (SVG) */}
      <svg
        className="ico-home"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
        style={{ marginRight: 6, verticalAlign: "-3px" }}
      >
        <path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1V10l-9-6.828zM20 10.75l-8-6.062-8 6.062V20h4v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6h4v-9.25z"/>
      </svg>
      Dashboard
    </button>
  </div>
</div>


      {/* Mensaje */}
      {strMsg ? (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#f8f8f8",
          }}
        >
          {strMsg}
        </div>
      ) : null}

      {/* Formulario */}
      <form onSubmit={fnGuardar} className="u-form">
         <div className="grid-2">
          <div>
            <label>Correo *</label>
            <input
              type="email"
              name="correo"
              value={frmUsuario.correo}
              onChange={onChange}
              placeholder="correo@dominio.com"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Nombre completo *</label>
            <input
              type="text"
              name="nombre_completo"
              value={frmUsuario.nombre_completo}
              onChange={onChange}
              placeholder="Nombre Apellido"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Rol</label>
            <select
              name="rol"
              value={frmUsuario.rol}
              onChange={onChange}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EMPLEADO">EMPLEADO</option>
              <option value="CLIENTE">CLIENTE</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="chkActivo"
              type="checkbox"
              name="activo"
              checked={!!frmUsuario.activo}
              onChange={onChange}
            />
            <label htmlFor="chkActivo">Activo</label>
          </div>

          <div>
            <label>
              {boolEditando ? "Nueva contraseña (opcional)" : "Contraseña *"}
            </label>
            <input
              type="password"
              name="contrasena"
              value={frmUsuario.contrasena}
              onChange={onChange}
              placeholder={boolEditando ? "Deja vacío para no cambiar" : "Mín. 6 caracteres"}
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Confirmar contraseña {boolEditando ? "(opcional)" : "*"}</label>
            <input
              type="password"
              name="confirmar"
              value={frmUsuario.confirmar}
              onChange={onChange}
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="chkHash"
              type="checkbox"
              checked={boolHashLocal}
              onChange={(e) => setBoolHashLocal(e.target.checked)}
            />
            <label htmlFor="chkHash">Hashear con SHA-256 en el cliente</label>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={boolLoading}>
          {boolEditando ? "Actualizar" : "Guardar"}
        </button>
        <button type="button" className="btn" onClick={fnNuevo} disabled={boolLoading}>
          Nuevo
        </button>
          {boolEditando && frmUsuario.id ? (
            <button 
              className="btn btn-danger"
              type="button"
              onClick={() => fnEliminar(frmUsuario.id)}
              disabled={boolLoading}
              style={{ padding: "8px 14px", background: "#e74c3c", color: "#fff" }}
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </form>

      {/* Buscador */}
      <div className="u-search">
        <input
          className="search"
          type="text"
          value={strQ}
          onChange={(e) => setStrQ(e.target.value)}
          placeholder="Buscar por correo / nombre / rol…"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="button" onClick={() => setStrQ("")} style={{ padding: "8px 14px" }}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table className="u-table">
          <thead>
            <tr style={{ textAlign: "left", background: "#f0f0f0" }}>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>ID</th>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>Correo</th>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>Nombre</th>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>Rol</th>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>Activo</th>
              <th style={{ padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {boolLoading && (
              <tr>
                <td colSpan={6} style={{ padding: 12 }}>Cargando…</td>
              </tr>
            )}
            {!boolLoading && arrFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 12 }}>Sin resultados.</td>
              </tr>
            )}
            {!boolLoading &&
              arrFiltrados.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{shortId(u.id)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{u.correo}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{u.nombre_completo}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{u.rol}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{u.activo ? "Sí" : "No"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <button
                      type="button"
                      onClick={() => fnEditar(u)}
                      style={{ padding: "6px 10px", marginRight: 6 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => fnEliminar(u.id)}
                      style={{ padding: "6px 10px", background: "#e74c3c", color: "#fff" }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
       </div>
     </div>
   </div>
 );
}
