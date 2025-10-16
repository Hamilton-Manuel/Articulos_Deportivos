// controllers/pagos.controller.js
require('dotenv').config();
const db = require("../models");
const Pago = db.pagos;
const Pedido = db.pedidos;
const Detalle = db.detalle_pedido;
const Producto = db.productos;

const pedidosCtrl = require("./pedidos.controller.js");

// ====== CONFIG DE STRIPE ======
// Claves de prueba (modo test).
const STRIPE_WEBHOOK_SECRET = "whsec_xxx_OPCIONAL_MIENTRAS_PRUEBAS";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ====== TU CRUD EXISTENTE (lo dejo igual) ======
exports.create = (req, res) => {
  const { pedido_id, proveedor_pago, intento_id, monto, moneda, estado } = req.body;
  if (!pedido_id || !proveedor_pago || monto == null) {
    return res.status(400).send({ message: "pedido_id, proveedor_pago y monto son obligatorios." });
  }
  Pago.create({ pedido_id, proveedor_pago, intento_id, monto, moneda, estado })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.findAll = (_req, res) => {
  Pago.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Pago.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Pago no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  Pago.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Pago actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el pago con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Pago.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Pago id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el pago con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.deleteAll = (_req, res) => {
  Pago.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} pagos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// ====== NUEVO: Crear sesión de Stripe Checkout ======
// POST /api/pagos/checkout  { pedido_id }
exports.checkoutStripe = async (req, res) => {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).send({ message: "pedido_id es obligatorio." });

    const pedido = await Pedido.findByPk(pedido_id);
    if (!pedido) return res.status(404).send({ message: "Pedido no encontrado." });
    if (pedido.estado === "PAGADO") return res.status(400).send({ message: "El pedido ya está pagado." });

    // Traer el detalle con producto para armar line_items desde la BD
    const detalles = await Detalle.findAll({ where: { pedido_id }, include: [{ model: Producto }] });
    if (!detalles.length) return res.status(400).send({ message: "El pedido no tiene detalle." });

    const line_items = detalles.map(d => ({
      quantity: d.cantidad,
      price_data: {
        currency: "usd",
        product_data: { name: d.producto?.nombre || "Producto", metadata: { producto_id: d.producto_id } },
        unit_amount: Math.round(Number(d.precio_unitario) * 100) // centavos
      }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/cancel",
      metadata: { pedido_id }
    });

    // Guarda un pago en estado REQUIERE_PAGO ligado a la sesión
    await Pago.create({
      pedido_id,
      proveedor_pago: "stripe",
      intento_id: session.id,   // guardamos session.id aquí
      monto: pedido.total,
      moneda: "USD",
      estado: "REQUIERE_PAGO"
    });

    return res.send({ url: session.url });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// ====== NUEVO: Webhook de Stripe ======
// Requiere raw body en server.js SOLO para esta ruta.
exports.webhookStripe = async (req, res) => {
  let event = req.body;

  // Si quieres validar la firma del webhook, descomenta:
  // const signature = req.headers["stripe-signature"];
  // try {
  //   event = require("stripe")(STRIPE_SECRET_KEY).webhooks.constructEvent(
  //     req.rawBody, signature, STRIPE_WEBHOOK_SECRET
  //   );
  // } catch (err) {
  //   return res.status(400).send(`Webhook error: ${err.message}`);
  // }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const pedido_id = session.metadata?.pedido_id;

      // 1) Actualizar el Pago a PAGADO y guardar payment_intent en intento_id (opcional)
      await Pago.update(
        { estado: "PAGADO", intento_id: session.payment_intent || session.id },
        { where: { intento_id: session.id } }
      );

      // 2) Confirmar pago en nuestro dominio (descuenta stock y marca pedido PAGADO)
      // Reutilizamos tu controller de pedidos
      const fakeRes = { send: () => {}, status: () => ({ send: () => {} }) };
      req.body = { pedido_id };
      await pedidosCtrl.confirmarPago(req, fakeRes);
    }

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
