// client/src/pages/Clientes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Clientes.css";

/*
  Clientes (solo editar/eliminar)
  - Sin creación: no hay POST.
  - Guardar solo si hay cliente seleccionado (PUT).
  - usuario_id bloqueado (solo lectura).
*/

export default function Clientes() {
  const navigate = useNavigate();
  const strAPI = import.meta.env.VITE_API_URL || "";
  const strToken = localStorage.getItem("token") || "";
  const objUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [boolLoading, setBoolLoading] = useState(false);
  const [strMsg, setStrMsg] = useState("");
  const [arrClientes, setArrClientes] = useState([]);
  const [strQ, setStrQ] = useState("");

  const frmInit = {
    id: "",
    usuario_id: "",
    correo: "",
    telefono: "",
    direccion_envio: "",
    direccion_facturacion: "",
  };
  const [frmCliente, setFrmCliente] = useState({ ...frmInit });
  const [boolEditando, setBoolEditando] = useState(false);

  const shortId = (s = "") => (s ? s.slice(0, 8) + "…" : "");

  const headersJSON = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: strToken ? `Bearer ${strToken}` : "",
    }),
    [strToken]
  );

  const fnFetchAll = async () => {
    try {
      setBoolLoading(true);
      setStrMsg("");
      const r = await fetch(`${strAPI}/api/clientes`, {
        method: "GET",
        headers: headersJSON,
      });
      if (r.status === 401) {
        setStrMsg("Sesión expirada. Inicia sesión.");
        navigate("/login");
        return;
      }
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();
      setArrClientes(Array.isArray(data) ? data : []);
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

  const arrFiltrados = useMemo(() => {
    const q = strQ.trim().toLowerCase();
    if (!q) return arrClientes;
    return arrClientes.filter((c) => {
      const s1 = (c?.correo || "").toLowerCase();
      const s2 = (c?.telefono || "").toLowerCase();
      const s3 = (c?.usuario?.nombre_completo || "").toLowerCase();
      const s4 = (c?.usuario?.correo || "").toLowerCase();
      return s1.includes(q) || s2.includes(q) || s3.includes(q) || s4.includes(q);
    });
  }, [arrClientes, strQ]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFrmCliente((prev) => ({ ...prev, [name]: value }));
  };

  const fnLimpiarSeleccion = () => {
    setFrmCliente({ ...frmInit });
    setBoolEditando(false);
    setStrMsg("");
  };

  const fnEditar = (obj) => {
    setFrmCliente({
      id: obj.id || "",
      usuario_id: obj.usuario_id || "",
      correo: obj.correo || "",
      telefono: obj.telefono || "",
      direccion_envio: obj.direccion_envio || "",
      direccion_facturacion: obj.direccion_facturacion || "",
    });
    setBoolEditando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fnEliminar = async (id) => {
    if (!id) return;
    const boolConfirm = window.confirm("¿Eliminar este cliente?");
    if (!boolConfirm) return;

    try {
      setBoolLoading(true);
      setStrMsg("");
      const r = await fetch(`${strAPI}/api/clientes/delete/${id}`, {
        method: "DELETE",
        headers: headersJSON,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Error ${r.status}`);
      }
      setStrMsg("Cliente eliminado.");
      await fnFetchAll();
      if (frmCliente.id === id) fnLimpiarSeleccion();
    } catch (e) {
      setStrMsg(`No se pudo eliminar: ${e.message}`);
    } finally {
      setBoolLoading(false);
    }
  };

  const fnValidar = () => {
    if (!frmCliente.id) {
      setStrMsg("Selecciona un cliente de la tabla para editar.");
      return false;
    }
    if (!frmCliente.correo && !frmCliente.telefono) {
      setStrMsg("Coloca al menos correo o teléfono.");
      return false;
    }
    return true;
  };

  const fnGuardar = async (e) => {
    e.preventDefault();
    if (!fnValidar()) return;

    const objPayload = {
      correo: frmCliente.correo || null,
      telefono: frmCliente.telefono || "",
      direccion_envio: frmCliente.direccion_envio || "",
      direccion_facturacion: frmCliente.direccion_facturacion || "",
    };

    try {
      setBoolLoading(true);
      setStrMsg("");
      const r = await fetch(`${strAPI}/api/clientes/update/${frmCliente.id}`, {
        method: "PUT",
        headers: headersJSON,
        body: JSON.stringify(objPayload),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Error ${r.status}`);
      }
      setStrMsg("Cliente actualizado.");
      await fnFetchAll();
    } catch (e) {
      setStrMsg(`No se pudo guardar: ${e.message}`);
    } finally {
      setBoolLoading(false);
    }
  };

  return (
<div className="clientes-page">
  <div className="c-head">
    <h2>Clientes</h2>
    <div className="c-head-actions">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate("/")} // <- cambia a "/dashboard" si aplica
        title="Ir a Home"
      >
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
        Ir a Dashboard
      </button>
    </div>
  </div>

      <h2>Clientes</h2>

      {strMsg ? <div className="clientes-msg">{strMsg}</div> : null}

      {!boolEditando ? (
        <div className="clientes-msg">
          Selecciona un cliente de la tabla para editar sus datos.
        </div>
      ) : null}

      {/* Formulario (solo edición) */}
      <form onSubmit={fnGuardar} className="clientes-form">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
            gap: 12,
            alignItems: "start",
          }}
        >
          <div>
            <label>Usuario ID (UUID)</label>
            <input
              type="text"
              name="usuario_id"
              value={frmCliente.usuario_id}
              onChange={onChange}
              className="input"
              disabled
              title="Este vínculo no se puede modificar aquí"
            />
          </div>

          <div>
            <label>Correo</label>
            <input
              type="email"
              name="correo"
              value={frmCliente.correo}
              onChange={onChange}
              placeholder="correo@dominio.com"
              className="input"
              disabled={!boolEditando}
            />
          </div>

          <div>
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={frmCliente.telefono}
              onChange={onChange}
              placeholder="Ej. 5555-5555"
              className="input"
              disabled={!boolEditando}
            />
          </div>

          <div>
            <label>Dirección de envío</label>
            <textarea
              name="direccion_envio"
              value={frmCliente.direccion_envio}
              onChange={onChange}
              rows={3}
              className="input"
              placeholder="Calle, avenida, referencias…"
              disabled={!boolEditando}
            />
          </div>

          <div>
            <label>Dirección de facturación</label>
            <textarea
              name="direccion_facturacion"
              value={frmCliente.direccion_facturacion}
              onChange={onChange}
              rows={3}
              className="input"
              placeholder="Razón social, NIT, dirección…"
              disabled={!boolEditando}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={boolLoading || !boolEditando || !frmCliente.id}
            className="btn btn-primary"
          >
            Guardar cambios
          </button>

          <button
            type="button"
            onClick={fnLimpiarSeleccion}
            disabled={boolLoading || !boolEditando}
            className="btn"
          >
            Cancelar
          </button>

          {boolEditando && frmCliente.id ? (
            <button
              type="button"
              onClick={() => fnEliminar(frmCliente.id)}
              disabled={boolLoading}
              className="btn btn-danger"
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </form>

      {/* Buscador */}
      <div className="c-searchbar">
        <input
          className="search"
          type="text"
          value={strQ}
          onChange={(e) => setStrQ(e.target.value)}
          placeholder="Buscar por cliente/usuario/correo/teléfono…"
        />
        <button
          type="button"
          onClick={() => setStrQ("")}
          className="btn"
        >
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Dirección envío</th>
              <th>Dirección facturación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {boolLoading && (
              <tr>
                <td colSpan={7} style={{ padding: 12 }}>Cargando…</td>
              </tr>
            )}
            {!boolLoading && arrFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 12 }}>Sin resultados.</td>
              </tr>
            )}
            {!boolLoading &&
              arrFiltrados.map((c) => (
                <tr key={c.id}>
                  <td>{shortId(c.id)}</td>
                  <td>
                    {c?.usuario
                      ? `${c.usuario.nombre_completo || ""} (${c.usuario.correo})`
                      : "—"}
                  </td>
                  <td>{c.correo || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>{c.direccion_envio || "—"}</td>
                  <td>{c.direccion_facturacion || "—"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => fnEditar(c)}
                      className="btn"
                      style={{ marginRight: 6 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => fnEliminar(c.id)}
                      className="btn btn-danger"
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
  );
}
