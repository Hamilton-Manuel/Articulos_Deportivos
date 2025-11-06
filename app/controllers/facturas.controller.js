const PDFDocument = require("pdfkit");
const db = require("../models");
const { Op } = db.Sequelize;
const Pago     = db.pagos;
const Pedido   = db.pedidos;
const Detalle  = db.detalle_pedido;
const Producto = db.productos;
const Cliente  = db.clientes;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const Usuario  = db.usuarios; // si luego quieres más datos

// --- Util: armar PDF básico ---
function renderFacturaPDF(res, payload) {
  const { pedido, items, cliente } = payload;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="factura_${pedido.id}.pdf"`
  );

  const doc = new PDFDocument({ margin: 36 });
  doc.pipe(res);

  // Encabezado
  doc.fontSize(18).text("RabiSport", { continued: true }).fontSize(10).text("  |  Factura");
  doc.moveDown(0.5);
  doc.fontSize(10).text(`No. pedido: ${pedido.id}`);
  doc.text(`Fecha: ${new Date(pedido.creado_en || Date.now()).toLocaleString()}`);
  doc.moveDown(0.5);
  doc.text(`Cliente: ${cliente?.correo || "—"}`);
  if (cliente?.telefono) doc.text(`Tel.: ${cliente.telefono}`);
  if (cliente?.direccion_facturacion) doc.text(`Dir. Fact.: ${cliente.direccion_facturacion}`);
  doc.moveDown();

  // Tabla de items
  doc.fontSize(11).text("Detalle", { underline: true });
  doc.moveDown(0.3);

  const colX = { desc: 36, qty: 360, price: 420, sub: 500 };
  doc.fontSize(10).text("Descripción", colX.desc, doc.y);
  doc.text("Cant.", colX.qty, doc.y);
  doc.text("Precio", colX.price, doc.y);
  doc.text("Subtotal", colX.sub, doc.y);
  doc.moveDown(0.2);
  doc.moveTo(36, doc.y).lineTo(559, doc.y).stroke();

  let total = 0;
  items.forEach((it) => {
    const precio = Number(it.producto?.precio_venta || it.precio_unitario || 0);
    const qty    = Number(it.cantidad || 0);
    const sub    = precio * qty;
    total += sub;

    doc.text(`${it.producto?.nombre || "Producto"}`, colX.desc, doc.y + 4, { width: 300 });
    doc.text(qty.toString(), colX.qty, doc.y);
    doc.text(precio.toFixed(2), colX.price, doc.y);
    doc.text(sub.toFixed(2), colX.sub, doc.y);
    doc.moveDown(0.6);
  });

  doc.moveTo(36, doc.y).lineTo(559, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(12).text(`Total: Q ${total.toFixed(2)}`, { align: "right" });

  doc.moveDown();
  doc.fontSize(9).fillColor("#666").text("Gracias por su compra.", { align: "center" });

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
      // si tienes STRIPE_SECRET_KEY configurada, resolvemos el payment_intent
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

  // Validar estado en JS (evita tocar el enum en SQL)
  const estado = String(pago.estado || "").toUpperCase();
  if (estado !== "PAGADO") {
    throw new Error(`El pago aún no está confirmado (estado: ${pago.estado}).`);
  }

  // Cliente (si existe)
  let cliente = null;
  try {
    // si guardas correo en pagos:
    if (pago.correo) cliente = await Cliente.findOne({ where: { correo: pago.correo } });
    // o bien por usuario del pedido:
    if (!cliente && pago.pedido?.usuario_id) {
      cliente = await Cliente.findOne({ where: { usuario_id: pago.pedido.usuario_id } });
    }
  } catch(_e){}

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

  // puedes ligar cliente por usuario_id o por correo según tu modelo
  const cliente = await Cliente.findOne({ where: { usuario_id: pedido.usuario_id } }).catch(()=>null);

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
