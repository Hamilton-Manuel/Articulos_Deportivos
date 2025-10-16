// controllers/pagos.controller.js
const db = require("../models");
const Pago = db.pagos;
const Pedido = db.pedidos;
const Detalle = db.detalle_pedido;
const Producto = db.productos;

const pedidosCtrl = require("./pedidos.controller.js");

// ====== CONFIG DE STRIPE ======
// Claves de prueba (modo test).
const STRIPE_SECRET_KEY   = "sk_test_51SIh5fGINSRiqAP8cKbGnEBH0Z4qgh8wihI1SZOQqiZ30f43osKAYszYnlxazOiMrVYfHT29meCZpCX0Mpy6RG6D00x71httYZ";
const STRIPE_WEBHOOK_SECRET = "whsec_xxx_OPCIONAL_MIENTRAS_PRUEBAS";

const stripe = require("stripe")(STRIPE_SECRET_KEY);

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

// ====== STRIPE CHECKOUT (página alojada por Stripe) ======
// POST /api/pagos/checkout { pedido_id }
exports.checkoutStripe = async (req, res) => {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).send({ message: "pedido_id es obligatorio." });

    const pedido = await Pedido.findByPk(pedido_id);
    if (!pedido) return res.status(404).send({ message: "Pedido no encontrado." });
    if (pedido.estado === "PAGADO") return res.status(400).send({ message: "El pedido ya está pagado." });

    // Trae detalle con producto para armar los items
    const detalles = await Detalle.findAll({ where: { pedido_id }, include: [{ model: Producto }] });
    if (!detalles.length) return res.status(400).send({ message: "El pedido no tiene detalle." });

    const line_items = detalles.map(d => ({
      quantity: d.cantidad,
      price_data: {
        currency: "usd",
        product_data: {
          name: d.producto?.nombre || "Producto",
          metadata: { producto_id: d.producto_id }
        },
        unit_amount: Math.round(Number(d.precio_unitario) * 100) // centavos
      }
    }));

    //  Redirigimos a las rutas del backend (no frontend aún)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "http://localhost:8081/api/pagos/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:8081/api/pagos/cancel",
      metadata: { pedido_id }
    });

    // Guarda el pago pendiente
    await Pago.create({
      pedido_id,
      proveedor_pago: "stripe",
      intento_id: session.id,
      monto: pedido.total,
      moneda: "USD",
      estado: "REQUIERE_PAGO"
    });

    // Devuelve la URL de Stripe
    return res.send({ url: session.url });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// ====== WEBHOOK DE STRIPE ======
// Stripe llama aquí automáticamente tras el pago.
exports.webhookStripe = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event = req.body;

  // Si ya tienes STRIPE_WEBHOOK_SECRET real, valida la firma
  try {
    if (STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET !== "whsec_xxx_OPCIONAL_MIENTRAS_PRUEBAS") {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
    }
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const pedido_id = session.metadata?.pedido_id;

      // 1️⃣ Actualizar el pago como PAGADO
      await Pago.update(
        { estado: "PAGADO", intento_id: session.payment_intent || session.id },
        { where: { intento_id: session.id } }
      );

      // 2️⃣ Confirmar el pedido en tu dominio (marca PAGADO y descuenta stock)
      const fakeRes = { send: () => {}, status: () => ({ send: () => {} }) };
      req.body = { pedido_id };
      await pedidosCtrl.confirmarPago(req, fakeRes);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Error webhookStripe:", err);
    return res.status(500).send({ message: err.message });
  }
};
