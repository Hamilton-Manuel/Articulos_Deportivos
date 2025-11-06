import React, { useMemo, useState } from "react";

export default function Reportes() {
  const strAPI   = import.meta.env.VITE_API_URL || "";
  const strToken = localStorage.getItem("token") || "";
  const objUser  = JSON.parse(localStorage.getItem("user") || "{}");

  // Guard de rol (solo ADMIN/EMPLEADO)
  if (!objUser?.rol || (objUser.rol !== "ADMIN" && objUser.rol !== "EMPLEADO")) {
    return <div style={{ padding: 16 }}>Acceso denegado.</div>;
  }

  const [strFecha, setStrFecha] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const [boolLoading, setBoolLoading] = useState(false);
  const [strMsg, setStrMsg] = useState("");
  const [arrRows, setArrRows] = useState([]);
  const [objTot, setObjTot] = useState({ pedidos: 0, items: 0, monto: 0 });

  const headersJSON = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: strToken ? `Bearer ${strToken}` : "",
    }),
    [strToken]
  );

  const shortId = (s = "") => (s ? s.slice(0, 8) + "…" : "");

  const fnConsultar = async () => {
    try {
      setBoolLoading(true);
      setStrMsg("");
      setArrRows([]);
      setObjTot({ pedidos: 0, items: 0, monto: 0 });

      const url = `${strAPI}/api/reportes/ventas?fecha=${encodeURIComponent(strFecha)}`;
      const r = await fetch(url, { headers: headersJSON });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `Error ${r.status}`);
      }
      const data = await r.json();
      setArrRows(Array.isArray(data?.rows) ? data.rows : []);
      setObjTot({
        pedidos: data?.totales?.pedidos || 0,
        items  : data?.totales?.items || 0,
        monto  : data?.totales?.monto || 0,
      });
    } catch (e) {
      setStrMsg(e.message);
    } finally {
      setBoolLoading(false);
    }
  };

  // ====== Exportar a Excel (CSV) ======
  const fnExportCSV = () => {
    if (!arrRows.length) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [];
    lines.push(`Reporte de ventas por fecha,${strFecha}`);
    lines.push(`Pedidos,${objTot.pedidos}`);
    lines.push(`Items,${objTot.items}`);
    lines.push(`Total,Q ${objTot.monto.toFixed(2)}`);
    lines.push("");
    lines.push(["No. Factura","Fecha/Hora","Cliente","Correo","Items","Total"].map(esc).join(","));
    for (const r of arrRows) {
      lines.push([
        r.pedido_id,
        new Date(r.fecha).toLocaleString(),
        r.cliente,
        r.correo || "",
        r.items,
        `Q ${Number(r.total).toFixed(2)}`
      ].map(esc).join(","));
    }
    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${strFecha}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ====== Exportar a PDF (imprimir a PDF desde el navegador) ======
  const fnExportPDF = () => {
    if (!arrRows.length) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const css = `
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:20px;color:#0b1115;}
      h1{margin:0 0 8px;font-size:20px}
      .muted{opacity:.75}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #ddd;padding:8px 10px;font-size:12px}
      th{background:#f2f4f8;text-align:left}
      td.num, th.num{ text-align:right}
      .kpis{display:flex;gap:18px;margin:10px 0 4px}
      .kpi{padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px}
      .id{font-family:ui-monospace,Menlo,Consolas,monospace}
    `;

    const head = `
      <h1>Reporte de ventas por fecha</h1>
      <div class="muted">Fecha: ${strFecha}</div>
      <div class="kpis">
        <div class="kpi"><b>Pedidos:</b> ${objTot.pedidos}</div>
        <div class="kpi"><b>Ítems:</b> ${objTot.items}</div>
        <div class="kpi"><b>Total:</b> Q ${objTot.monto.toFixed(2)}</div>
      </div>
    `;

    const rowsHtml = arrRows.map(r => `
      <tr>
        <td class="id">${r.pedido_id}</td>
        <td>${new Date(r.fecha).toLocaleString()}</td>
        <td>${r.cliente}</td>
        <td>${r.correo || ""}</td>
        <td class="num">${r.items}</td>
        <td class="num">Q ${Number(r.total).toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>ventas_${strFecha}</title><style>${css}</style></head>
      <body>
        ${head}
        <table>
          <thead>
            <tr>
              <th>No. Factura</th>
              <th>Fecha/Hora</th>
              <th>Cliente</th>
              <th>Correo</th>
              <th class="num">Ítems</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print(); // El usuario elige "Guardar como PDF"
  };

  return (
    <div className="usuarios-shell">
      <div className="usuarios-main">
        <div className="usuarios-page">
          <div className="u-head">
            <h2>Reporte de ventas por fecha</h2>
            <div className="u-head-actions">
              <button
                type="button"
                className="btn"
                onClick={() => window.history.back()}
              >
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

          {/* Filtros */}
          <form
            className="u-form"
            onSubmit={(e) => {
              e.preventDefault();
              fnConsultar();
            }}
          >
            <div className="grid-2">
              <div>
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={strFecha}
                  onChange={(e) => setStrFecha(e.target.value)}
                  className="inp"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap:"wrap" }}>
              <button type="submit" className="btn btn-primary" disabled={boolLoading}>
                {boolLoading ? "Consultando…" : "Consultar"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const d = new Date();
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  setStrFecha(`${y}-${m}-${day}`);
                }}
              >
                Hoy
              </button>

              {/* === Botones de exportación === */}
              <button
                type="button"
                className="btn"
                onClick={fnExportCSV}
                disabled={!arrRows.length}
                title="Descargar Excel (CSV)"
              >
                Excel (CSV)
              </button>
              <button
                type="button"
                className="btn"
                onClick={fnExportPDF}
                disabled={!arrRows.length}
                title="Descargar PDF"
              >
                PDF
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
                background: "rgba(255,255,255,.06)",
              }}
            >
              {strMsg}
            </div>
          ) : null}

          {/* KPIs */}
          <div className="kpis cats" style={{ marginTop: 12 }}>
            <div className="kpi">
              <div className="kpi-title">Pedidos</div>
              <div className="kpi-value">{objTot.pedidos}</div>
            </div>
            <div className="kpi">
              <div className="kpi-title">Ítems vendidos</div>
              <div className="kpi-value">{objTot.items}</div>
            </div>
            <div className="kpi">
              <div className="kpi-title">Total Q</div>
              <div className="kpi-value">Q {objTot.monto.toFixed(2)}</div>
            </div>
          </div>

          {/* Tabla resultados */}
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="u-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th className="col-id">No. Factura</th>
                  <th>Fecha/Hora</th>
                  <th>Cliente</th>
                  <th>Correo</th>
                  <th className="num">Ítems</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {boolLoading && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12 }}>Cargando…</td>
                  </tr>
                )}
                {!boolLoading && arrRows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 12 }}>Sin resultados.</td>
                  </tr>
                )}
                {!boolLoading &&
                  arrRows.map((r) => (
                    <tr key={r.pedido_id}>
                      <td className="col-id" title={r.pedido_id}>{r.pedido_id}</td>
                      <td>{new Date(r.fecha).toLocaleString()}</td>
                      <td>{r.cliente}</td>
                      <td>{r.correo || "—"}</td>
                      <td className="num">{r.items}</td>
                      <td className="num">Q {Number(r.total).toFixed(2)}</td>
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
