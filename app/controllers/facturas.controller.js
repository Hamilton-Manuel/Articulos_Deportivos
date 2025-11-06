// controllers/facturas.controller.js
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const db = require("../models");
const { Op } = db.Sequelize;
const Pago     = db.pagos;
const Pedido   = db.pedidos;
const Detalle  = db.detalle_pedido;
const Producto = db.productos;
const Cliente  = db.clientes;
const Usuario  = db.usuarios; // para traer nombre_completo
const stripe   = require("stripe")(process.env.STRIPE_SECRET_KEY);

// --- Util: armar PDF con diseño ---
function renderFacturaPDF(res, payload) {
  const { pedido, items, cliente } = payload;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="factura_${pedido.id}.pdf"`
  );

  // A4, márgenes y buffer para numeración
  const doc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true });
  doc.pipe(res);

  // ---- Branding / medidas base
  const BRAND = { primary: "#2563eb", light: "#eef2ff", gray: "#6b7280", dark: "#111827" };
  const X = doc.page.margins.left;
  const Y = doc.page.margins.top;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --------- Franja superior
  doc.save().rect(X, Y, W, 70).fill(BRAND.light).restore();

  // Logo (opcional en server/assets/logo.png)
  try {
    const logo = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logo)) {
      doc.image(logo, X + 8, Y + 10, { width: 40 });
    }
  } catch (_) {}

// Marca y metadatos
doc
  .fillColor(BRAND.dark)
  .font("Helvetica-Bold")
  .fontSize(20)
  .text("RabiSport", X + 60, Y + 12);

doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor(BRAND.gray)
  .text("Factura", X + 60, Y + 36);

// Columna derecha anclada ~58% del ancho, para que no envuelva
doc.fillColor(BRAND.dark).fontSize(10);
const rColX = X + Math.floor(W * 0.58);

doc.text(`No. factura: ${pedido.id}`, rColX, Y + 12, {
  width: W - (rColX - X) - 10,
  align: "left"
});
doc.text(
  `Fecha: ${new Date(pedido.creado_en || Date.now()).toLocaleString()}`,
  rColX,
  Y + 26,
  { width: W - (rColX - X) - 10, align: "left" }
);


  // --------- Caja de cliente
  const nombreMostrable =
    cliente?.nombre ||
    cliente?.usuario?.nombre_completo ||
    cliente?.correo ||
    "—";

  const boxY = Y + 80;
  const boxH = 62;
  doc
    .lineWidth(0.8)
    .strokeColor(BRAND.primary)
    .roundedRect(X, boxY, W, boxH, 6)
    .stroke();

  doc.font("Helvetica-Bold").fillColor(BRAND.dark).text("Cliente", X + 10, boxY + 6);
  doc
    .font("Helvetica")
    .fillColor(BRAND.dark)
    .text(nombreMostrable, X + 10, boxY + 22, { width: 300 });

  if (cliente?.telefono) {
    doc.text(`Tel.: ${cliente.telefono}`, X + 320, boxY + 6);
  }
  if (cliente?.direccion_facturacion) {
    doc.text(
      `Dir. Fact.: ${cliente.direccion_facturacion}`,
      X + 320,
      boxY + 22,
      { width: 200 }
    );
  }

  // --------- Tabla de items (encabezado + filas)
  const tableTopStart = boxY + boxH + 14;
  const rowH = 24;
  const col = { desc: X + 10, qty: X + 330, price: X + 390, sub: X + 470 };

  const drawTableHeader = (y) => {
    doc.save().rect(X, y, W, rowH).fill(BRAND.primary).restore();
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10);
    doc.text("Descripción", col.desc, y + 7);
    doc.text("Cant.",       col.qty,  y + 7);
    doc.text("Precio",      col.price,y + 7);
    doc.text("Subtotal",    col.sub,  y + 7);
  };

  let y = tableTopStart;
  drawTableHeader(y);
  y += rowH;

  let total = 0;
  const Y_LIMIT = doc.page.height - doc.page.margins.bottom - 90;

  doc.font("Helvetica").fontSize(10).fillColor(BRAND.dark);

  for (let i = 0; i < items.length; i++) {
    const it     = items[i];
    const precio = Number(it.producto?.precio_venta || it.precio_unitario || 0);
    const qty    = Number(it.cantidad || 0);
    const sub    = precio * qty;
    total += sub;

    // Salto de página si se llena
    if (y + rowH > Y_LIMIT) {
      // línea al final de la página actual
      doc.strokeColor("#e5e7eb").moveTo(X, y).lineTo(X + W, y).stroke();
      doc.addPage();
      // Redibujar encabezado en la nueva página
      y = Y;
      drawTableHeader(y);
      y += rowH;
      doc.font("Helvetica").fontSize(10).fillColor(BRAND.dark);
    }

    // Zebra
    if (i % 2 === 0) {
      doc.save().rect(X, y, W, rowH).fill("#f8fafc").restore();
    }

    // Contenido
    doc.fillColor(BRAND.dark);
    doc.text(`${it.producto?.nombre || "Producto"}`, col.desc, y + 7, { width: 300 });
    doc.text(qty.toString(),              col.qty,   y + 7);
    doc.text(precio.toFixed(2),           col.price, y + 7);
    doc.text(sub.toFixed(2),              col.sub,   y + 7);

    y += rowH;
  }

  // Línea de cierre y total
  doc.strokeColor("#e5e7eb").moveTo(X, y).lineTo(X + W, y).stroke();
  doc.font("Helvetica-Bold").fontSize(12)
     .text(`Total: Q ${total.toFixed(2)}`, X, y + 10, { align: "right", width: W });

  // --------- Pie y numeración de páginas
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor(BRAND.gray)
       .text(`Página ${i + 1} de ${range.count}`,
             X, doc.page.height - 30, { width: W, align: "center" });
  }
  doc.fontSize(9).fillColor(BRAND.gray)
     .text("Gracias por su compra.",
           X, doc.page.height - 50, { width: W, align: "center" });

  doc.end();
}

// --- Cargar datos por session_id SOLO desde BD (y opcionalmente usando payment_intent) ---
async function loadBySession(session_id) {
  // a) buscar por intento_id = session_id
  let pago = await Pago.findOne({
    where: { intento_id: session_id },
    include: [{
      model: Pedido,
      include: [{ model: Detalle, include: [{ model: Producto }] }]
    }]
  });

  // b) si no aparece, intentar resolver payment_intent y volver a buscar
  if (!pago) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const pi = session?.payment_intent?.toString?.() || session?.payment_intent || null;
      if (pi) {
        pago = await Pago.findOne({
          where: { intento_id: pi },
          include: [{
            model: Pedido,
            include: [{ model: Detalle, include: [{ model: Producto }] }]
          }]
        });
      }
    } catch (_e) {
      // si Stripe falla no rompas el flujo; seguimos sin pago
    }
  }

  if (!pago) throw new Error("No se encontró el pago asociado a ese session_id.");
  if (!pago.pedido) throw new Error("El pago no tiene pedido asociado.");

  const estado = String(pago.estado || "").toUpperCase();
  if (estado !== "PAGADO") {
    throw new Error(`El pago aún no está confirmado (estado: ${pago.estado}).`);
  }

  // Cliente (ligado al pedido por cliente_id; fallback por correo)
  let cliente = null;
  try {
    if (pago.pedido?.cliente_id) {
      cliente = await Cliente.findByPk(pago.pedido.cliente_id, {
        include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }]
      });
    }
    if (!cliente && pago.correo) {
      cliente = await Cliente.findOne({
        where: { correo: pago.correo },
        include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }]
      });
    }
  } catch (_e) {}

  return {
    pedido: pago.pedido,
    items : pago.pedido.detalles || pago.pedido.detalle_pedidos || [],
    cliente: cliente || { correo: pago.correo || "" }
  };
}

// --- Cargar datos por id de pedido ---
async function loadByPedido(pedidoId) {
  const pedido = await Pedido.findByPk(pedidoId, {
    include: [{ model: Detalle, include: [{ model: Producto }] }]
  });
  if (!pedido) throw new Error("Pedido no encontrado.");

  const cliente = await Cliente.findByPk(pedido.cliente_id, {
    include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }]
  }).catch(() => null);

  return { pedido, items: pedido.detalles || pedido.detalle_pedidos || [], cliente };
}

// === Handlers ===
exports.pdfBySession = async (req, res) => {
  try {
    const session_id = req.params.session_id;
    const data = await loadBySession(session_id);
    renderFacturaPDF(res, data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.pdfByPedido = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await loadByPedido(id);
    renderFacturaPDF(res, data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
