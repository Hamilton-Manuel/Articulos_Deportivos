const db = require("../models");
const Pedido = db.pedidos;
const Detalle = db.detalle_pedido;
const Producto = db.productos;

// Create (básico, solo cabecera)
exports.create = (req, res) => {
  const { cliente_id, direccion_envio, estado, subtotal, impuestos, total } = req.body;
  if (!direccion_envio) return res.status(400).send({ message: "direccion_envio es obligatoria." });

  Pedido.create({ cliente_id, direccion_envio, estado, subtotal, impuestos, total })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: crear con detalle (items: [{producto_id, cantidad, precio_unitario}])
exports.crearConDetalle = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { cliente_id, direccion_envio, items = [] } = req.body;
    if (!direccion_envio || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).send({ message: "direccion_envio e items son obligatorios." });
    }

    let subtotal = 0;
    for (const it of items) {
      if (!it.producto_id || !it.cantidad || it.precio_unitario == null) {
        await t.rollback();
        return res.status(400).send({ message: "Cada item requiere producto_id, cantidad y precio_unitario." });
      }
      subtotal += (Number(it.cantidad) * Number(it.precio_unitario));
    }
    const impuestos = 0; // ajusta según regla (IVA, etc.)
    const total = subtotal + impuestos;

    const pedido = await Pedido.create({ cliente_id, direccion_envio, subtotal, impuestos, total }, { transaction: t });

    for (const it of items) {
      await Detalle.create({
        pedido_id: pedido.id,
        producto_id: it.producto_id,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        total_linea: Number(it.cantidad) * Number(it.precio_unitario)
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).send(pedido);
  } catch (err) {
    await t.rollback();
    res.status(500).send({ message: err.message });
  }
};

// Read all (con detalle opcional)
exports.findAll = (_req, res) => {
  Pedido.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Pedido.findByPk(id, { include: [{ model: Detalle, include: [{ model: Producto, attributes: ["id", "sku", "nombre"] }] }] })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Pedido no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Pedido.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Pedido actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el pedido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Pedido.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Pedido id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el pedido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Pedido.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} pedidos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
