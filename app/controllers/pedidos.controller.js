// controllers/pedidos.controller.js
const db = require("../models");
const Pedido = db.pedidos;
const Detalle = db.detalle_pedido;
const Producto = db.productos;
const Inventario = db.inventario;
const Movimiento = db.movimientos_inventario; // opcional, si lo registras aquí

// ===== Helpers =====
const esEnteroPositivo = (n) => Number.isInteger(Number(n)) && Number(n) > 0;

// ===== Crear SOLO cabecera (opcional; suele usarse crearConDetalle) =====
exports.create = (req, res) => {
  const { cliente_id, direccion_envio, estado, subtotal, impuestos, total } = req.body;
  if (!direccion_envio) return res.status(400).send({ message: "direccion_envio es obligatoria." });

  // Nota: aquí NO hay detalle ni validación de stock; es solo cabecera "en blanco"
  Pedido.create({ cliente_id, direccion_envio, estado, subtotal, impuestos, total }, { req })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// ===== Crear pedido con detalle y validación de stock =====
// items: [{ producto_id, cantidad }]
exports.crearConDetalle = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { cliente_id, direccion_envio, items = [] } = req.body;

    // 1) Validaciones básicas
    if (!direccion_envio || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).send({ message: "direccion_envio e items son obligatorios." });
    }

    // 2) Validar cada item: existencia de producto, activo, cantidad > 0 y stock disponible
    let subtotal = 0;
    const cache = new Map(); // cache por producto_id

    for (const it of items) {
      if (!it.producto_id || it.cantidad == null || !esEnteroPositivo(it.cantidad)) {
        await t.rollback();
        return res.status(400).send({ message: "Cada item requiere producto_id y cantidad entera > 0." });
      }

      // Producto (desde BD)
      let prod = cache.get(`prod_${it.producto_id}`);
      if (!prod) {
        prod = await Producto.findByPk(it.producto_id, { transaction: t });
        cache.set(`prod_${it.producto_id}`, prod);
      }
      if (!prod || !prod.activo) {
        await t.rollback();
        return res.status(404).send({ message: `Producto ${it.producto_id} no existe o está inactivo.` });
      }

      // Inventario (disponibilidad, no se descuenta aquí)
      let inv = cache.get(`inv_${it.producto_id}`);
      if (!inv) {
        inv = await Inventario.findByPk(it.producto_id, { transaction: t });
        cache.set(`inv_${it.producto_id}`, inv);
      }
      const disponible = inv ? Number(inv.existencias) : 0;
      if (disponible < Number(it.cantidad)) {
        await t.rollback();
        return res.status(400).send({ message: `Stock insuficiente para '${prod.nombre}'. Disponible: ${disponible}.` });
      }

      // Precio desde BD (precio_venta)
      const precio_unitario = Number(prod.precio_venta);
      subtotal += precio_unitario * Number(it.cantidad);
    }

    const impuestos = 0; // Ajusta si usarás IVA
    const total = subtotal + impuestos;

    // 3) Crear cabecera (estado PENDIENTE por defecto)
    const pedido = await Pedido.create(
      { cliente_id, direccion_envio, subtotal, impuestos, total },
      { transaction: t },{ req }
    );

    // 4) Crear detalle (precio_venta desde BD)
    for (const it of items) {
      const prod = cache.get(`prod_${it.producto_id}`);
      const precio_unitario = Number(prod.precio_venta);
      await Detalle.create({
        pedido_id: pedido.id,
        producto_id: it.producto_id,
        cantidad: Number(it.cantidad),
        precio_unitario,
        total_linea: precio_unitario * Number(it.cantidad)
      }, { transaction: t },{ req });
    }

    await t.commit();
    return res.status(201).send(pedido);
  } catch (err) {
    await t.rollback();
    return res.status(500).send({ message: err.message });
  }
};

// ===== Confirmar pago: marcar PAGADO y descontar stock (con movimientos VENTA) =====
// Body: { pedido_id }
exports.confirmarPago = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) {
      await t.rollback();
      return res.status(400).send({ message: "pedido_id es obligatorio." });
    }

    const pedido = await Pedido.findByPk(pedido_id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).send({ message: "Pedido no encontrado." });
    }
    if (pedido.estado === "PAGADO") {
      await t.rollback();
      return res.status(400).send({ message: "El pedido ya está pagado." });
    }

    // Traer todo el detalle
    const detalles = await Detalle.findAll({ where: { pedido_id }, transaction: t });
    if (!detalles.length) {
      await t.rollback();
      return res.status(400).send({ message: "El pedido no tiene detalle." });
    }

    // Validar stock nuevamente por si algo cambió
    for (const d of detalles) {
      const inv = await Inventario.findByPk(d.producto_id, { transaction: t });
      const disponible = inv ? Number(inv.existencias) : 0;
      if (disponible < Number(d.cantidad)) {
        await t.rollback();
        return res.status(400).send({ message: `Stock insuficiente al confirmar pago. Prod=${d.producto_id} disponible=${disponible}.` });
      }
    }

    // Descontar inventario y registrar movimientos (VENTA)
    for (const d of detalles) {
      const inv = await Inventario.findByPk(d.producto_id, { transaction: t });
      const nuevo = Number(inv.existencias) - Number(d.cantidad);
      await inv.update({ existencias: nuevo, actualizado_en: new Date() }, { transaction: t });

      if (Movimiento) {
        await Movimiento.create({
          producto_id: d.producto_id,
          cantidad: Number(d.cantidad),
          tipo: "VENTA",
          motivo: `Pedido ${pedido_id}`,
          pedido_id
        }, { transaction: t },{ req });
      }
    }

    // Marcar como PAGADO
    await pedido.update({ estado: "PAGADO" }, { transaction: t },{ req });

    await t.commit();
    return res.send({ message: "Pago confirmado y stock descontado.", pedido_id });
  } catch (err) {
    await t.rollback();
    return res.status(500).send({ message: err.message });
  }
};

// ===== Lecturas =====
exports.findAll = (_req, res) => {
  Pedido.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Pedido.findByPk(id, {
    include: [{ model: Detalle, include: [{ model: Producto, attributes: ["id", "sku", "nombre"] }] }]
  })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Pedido no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// ===== Update (cabecera) =====
// *No* recomendado para cambiar totales manualmente; se recalculan desde los detalles.
// Úsalo solo para actualizar direccion_envio o estado (p. ej., ENVIADO/CANCELADO).
exports.update = (req, res) => {
  const id = req.params.id;
  Pedido.update(req.body, { where: { id } },{ req })
    .then(([count]) => count == 1
      ? res.send({ message: "Pedido actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el pedido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// ===== Delete =====
exports.delete = (req, res) => {
  const id = req.params.id;
  Pedido.destroy({ where: { id } },{ req })
    .then(count => count == 1
      ? res.status(200).send({ message: `Pedido id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el pedido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.deleteAll = (_req, res) => {
  Pedido.destroy({ where: {}, truncate: false },{_req})
    .then(nums => res.send({ message: `${nums} pedidos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
// === Helpers internos para carrito ===
async function ensureClienteForUser(userId, correoTx, t) {
  const db = require("../models");
  const Cliente = db.clientes;
  let cli = await Cliente.findOne({ where: { usuario_id: userId }, transaction: t });
  if (!cli) {
    cli = await Cliente.create({ usuario_id: userId, correo: correoTx || null }, { transaction: t });
  }
  return cli;
}

async function getOrCreateOpenPedido(clienteId, t) {
  let ped = await Pedido.findOne({ where: { cliente_id: clienteId, estado: "PENDIENTE" }, transaction: t });
  if (!ped) {
    ped = await Pedido.create({
      cliente_id: clienteId,
      direccion_envio: "",
      estado: "PENDIENTE",
      subtotal: 0,
      impuestos: 0,
      total: 0
    }, { transaction: t });
  }
  return ped;
}

async function recalcPedido(pedidoId, t) {
  const rows = await Detalle.findAll({ where: { pedido_id: pedidoId }, transaction: t });
  const subtotal = rows.reduce((a, r) => a + Number(r.total_linea || 0), 0);
  const impuestos = 0; // ajusta si usarás IVA
  const total = subtotal + impuestos;
  await Pedido.update({ subtotal, impuestos, total }, { where: { id: pedidoId }, transaction: t });
  return { subtotal, impuestos, total };
}

// GET /api/pedidos/open  -> devuelve el pedido PENDIENTE + items
exports.open = async (req, res) => {
  const db = require("../models");
  const Usuario = db.usuarios;
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const user = await Usuario.findByPk(userId, { transaction: t });
    const cli = await ensureClienteForUser(userId, user?.correo, t);

    const ped = await Pedido.findOne({ where: { cliente_id: cli.id, estado: "PENDIENTE" }, transaction: t });
    if (!ped) { await t.commit(); return res.json({ pedido: null, items: [], totals: { subtotal: 0, impuestos: 0, total: 0 } }); }

    const items = await Detalle.findAll({
      where: { pedido_id: ped.id },
      include: [{ model: Producto, attributes: ["id","sku","nombre","precio_venta"] }],
      transaction: t
    });
    const totals = await recalcPedido(ped.id, t);

    await t.commit();
    return res.json({ pedido: ped, items, totals });
  } catch (e) {
    await t.rollback();
    return res.status(500).send({ message: e.message });
  }
};

// POST /api/pedidos/sync  { items:[{producto_id, cantidad}] }  -> upsert detalle
exports.sync = async (req, res) => {
  const db = require("../models");
  const Usuario = db.usuarios;
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const reqItems = Array.isArray(req.body.items) ? req.body.items : [];
    const user = await Usuario.findByPk(userId, { transaction: t });
    const cli = await ensureClienteForUser(userId, user?.correo, t);
    const ped = await getOrCreateOpenPedido(cli.id, t);

    // Mapear existentes
    const actuales = await Detalle.findAll({ where: { pedido_id: ped.id }, transaction: t });
    const mapAct = new Map(actuales.map(d => [String(d.producto_id), d]));
    const vistos = new Set();

    for (const it of reqItems) {
      const prodId = String(it.producto_id);
      const q = Math.max(1, parseInt(it.cantidad, 10) || 1);

      const prod = await Producto.findByPk(prodId, { transaction: t });
      if (!prod || !prod.activo) continue;

      const precio = Number(prod.precio_venta || 0);
      const total_linea = precio * q;

      if (mapAct.has(prodId)) {
        const det = mapAct.get(prodId);
        await det.update({ cantidad: q, precio_unitario: precio, total_linea }, { transaction: t });
      } else {
        await Detalle.create({ pedido_id: ped.id, producto_id: prodId, cantidad: q, precio_unitario: precio, total_linea }, { transaction: t });
      }
      vistos.add(prodId);
    }

    // Borrar líneas que ya no vienen
    for (const [pid, d] of mapAct.entries()) {
      if (!vistos.has(pid)) await Detalle.destroy({ where: { id: d.id }, transaction: t });
    }

    const totals = await recalcPedido(ped.id, t);
    const items = await Detalle.findAll({
      where: { pedido_id: ped.id },
      include: [{ model: Producto, attributes: ["id","sku","nombre","precio_venta"] }],
      transaction: t
    });

    await t.commit();
    return res.json({ ok: true, pedido: ped, items, totals });
  } catch (e) {
    await t.rollback();
    return res.status(500).send({ message: e.message });
  }
};

