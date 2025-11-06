import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
const COLORS = {
  unidades: "#06b6d4", // cian
  ingresos : "#f59e0b", // ámbar
  totalQ   : "#34d399", // verde
  pedidos  : "#a78bfa"  // lila
};

// Página de gráficas (ranking productos / ranking usuarios)
export default function Graficas() {
  // --- Auth / API ---
  const strAPI   = import.meta.env.VITE_API_URL || "";
  const strToken = localStorage.getItem("token") || "";
  const objUser  = JSON.parse(localStorage.getItem("user") || "{}");

  // Guard de rol (solo ADMIN/EMPLEADO)
  if (!objUser?.rol || (objUser.rol !== "ADMIN" && objUser.rol !== "EMPLEADO")) {
    return <div style={{ padding: 16 }}>Acceso denegado.</div>;
  }

  // --- Estado ---
  const [boolLoading, setBoolLoading] = useState(false);
  const [strMsg, setStrMsg] = useState("");
  const [arrTopProductos, setArrTopProductos] = useState([]);
  const [arrTopUsuarios, setArrTopUsuarios] = useState([]);
  const [intLimit, setIntLimit] = useState(5);

  const headersJSON = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: strToken ? `Bearer ${strToken}` : "",
    }),
    [strToken]
  );

  // --- Cargar ambos rankings ---
  const fnCargar = async () => {
    try {
      setBoolLoading(true);
      setStrMsg("");
      setArrTopProductos([]);
      setArrTopUsuarios([]);

      const u1 = `${strAPI}/api/reportes/top-productos?limit=${intLimit}`;
      const u2 = `${strAPI}/api/reportes/top-usuarios?limit=${intLimit}`;

      const [r1, r2] = await Promise.all([
        fetch(u1, { headers: headersJSON }),
        fetch(u2, { headers: headersJSON })
      ]);

      if (!r1.ok) throw new Error(`Top productos: ${r1.status}`);
      if (!r2.ok) throw new Error(`Top usuarios: ${r2.status}`);

      const j1 = await r1.json();
      const j2 = await r2.json();

      setArrTopProductos(Array.isArray(j1?.rows) ? j1.rows : []);
      setArrTopUsuarios(Array.isArray(j2?.rows) ? j2.rows : []);
    } catch (e) {
      setStrMsg(e.message);
    } finally {
      setBoolLoading(false);
    }
  };

  useEffect(() => {
    fnCargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intLimit]);

  return (
    <div className="usuarios-shell">
      <div className="usuarios-main">
        <div className="usuarios-page">
          {/* Encabezado */}
          <div className="u-head">
            <h2>Gráficas</h2>
            <div className="u-head-actions">
              <button type="button" className="btn" onClick={() => window.history.back()}>
                ← Atrás
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => (window.location.href = "/")}
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
                Home
              </button>
            </div>
          </div>

          {/* Filtros simples */}
          <form
            className="u-form"
            onSubmit={(e) => { e.preventDefault(); fnCargar(); }}
          >
            <div className="grid-2">
              <div>
                <label>Top (límite)</label>
                <select
                  className="inp"
                  value={intLimit}
                  onChange={(e) => setIntLimit(parseInt(e.target.value, 10))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={boolLoading}>
                {boolLoading ? "Cargando…" : "Actualizar"}
              </button>
            </div>
          </form>

          {/* Mensaje */}
          {strMsg ? (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: 12,
                background: "rgba(255,255,255,.06)"
              }}
            >
              {strMsg}
            </div>
          ) : null}

          {/* Gráficas */}
          <div className="grid-2" style={{ marginTop: 16 }}>
            {/* Top productos */}
            <div className="kpi" style={{ padding: 0 }}>
              <div className="kpi-title" style={{ padding: "12px 12px 0" }}>
                Producto más vendido (unidades)
              </div>
              <div style={{ height: 320, padding: 12 }}>
                {arrTopProductos.length === 0 ? (
                  <div className="info">Sin datos.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={arrTopProductos}>
                    <CartesianGrid stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="nombre"
                        tick={{ fill: "#dbe7ee" }}
                        axisLine={{ stroke: "rgba(255,255,255,.2)" }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: "#b7c9d6" }}
                        axisLine={{ stroke: "rgba(255,255,255,.2)" }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ background: "rgba(15,23,30,.98)", border: "1px solid rgba(255,255,255,.12)", color:"#e6f6ff" }}
                        labelStyle={{ color:"#e6f6ff" }}
                    />
                    <Legend wrapperStyle={{ color:"#dbe7ee" }} />
                    <Bar dataKey="vendidos" name="Unidades" fill={COLORS.unidades} radius={[6,6,0,0]} />
                    <Bar dataKey="ingresos" name="Ingresos Q" fill={COLORS.ingresos} radius={[6,6,0,0]} />
                    </BarChart>

                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top usuarios por gasto */}
            <div className="kpi" style={{ padding: 0 }}>
              <div className="kpi-title" style={{ padding: "12px 12px 0" }}>
                Usuarios con mayor gasto (Q)
              </div>
              <div style={{ height: 320, padding: 12 }}>
                {arrTopUsuarios.length === 0 ? (
                  <div className="info">Sin datos.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={arrTopUsuarios}>
                    <CartesianGrid stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="usuario_nombre"
                        tick={{ fill: "#dbe7ee" }}
                        axisLine={{ stroke: "rgba(255,255,255,.2)" }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: "#b7c9d6" }}
                        axisLine={{ stroke: "rgba(255,255,255,.2)" }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ background: "rgba(15,23,30,.98)", border: "1px solid rgba(255,255,255,.12)", color:"#e6f6ff" }}
                        labelStyle={{ color:"#e6f6ff" }}
                    />
                    <Legend wrapperStyle={{ color:"#dbe7ee" }} />
                    <Bar dataKey="total_q" name="Total Q" fill={COLORS.totalQ} radius={[6,6,0,0]} />
                    <Bar dataKey="pedidos" name="Pedidos" fill={COLORS.pedidos} radius={[6,6,0,0]} />
                    </BarChart>

                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Tablas de verificación */}
          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="u-table">
              <thead>
                <tr>
                  <th colSpan={3}>Top productos</th>
                </tr>
                <tr>
                  <th>Producto</th><th className="num">Unidades</th><th className="num">Ingresos Q</th>
                </tr>
              </thead>
              <tbody>
                {arrTopProductos.map((r) => (
                  <tr key={r.producto_id || r.id || r.nombre}>
                    <td>{r.nombre}</td>
                    <td className="num">{Number(r.vendidos || r.unidades || 0)}</td>
                    <td className="num">Q {Number(r.ingresos || r.ingresos_q || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {arrTopProductos.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 10 }}>Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table className="u-table">
              <thead>
                <tr>
                  <th colSpan={4}>Top usuarios</th>
                </tr>
                <tr>
                  <th>Usuario</th><th>Correo</th><th className="num">Pedidos</th><th className="num">Total Q</th>
                </tr>
              </thead>
              <tbody>
                {arrTopUsuarios.map((u) => (
                  <tr key={u.usuario_id}>
                    <td>{u.usuario_nombre}</td>
                    <td>{u.usuario_correo}</td>
                    <td className="num">{Number(u.pedidos || 0)}</td>
                    <td className="num">Q {Number(u.total_q || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {arrTopUsuarios.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 10 }}>Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
