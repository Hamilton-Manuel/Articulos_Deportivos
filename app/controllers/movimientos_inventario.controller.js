const db = require("../models");
const Movimiento = db.movimientos_inventario;
const Inventario = db.inventario;

// Create (solo registra el movimiento)
exports.create = (req, res) => {
  const { producto_id, cantidad, tipo, motivo, pedido_id } = req.body;
  if (!producto_id || !cantidad || !tipo) {
    return res.status(400).send({ message: "producto_id, cantidad y tipo son obligatorios." });
  }

  Movimiento.create({ producto_id, cantidad, tipo, motivo, pedido_id })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: Registrar y actualizar inventario en una transacción
exports.registrar = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { producto_id, cantidad, tipo, motivo, pedido_id } = req.body;
    if (!producto_id || !cantidad || !tipo) {
      await t.rollback();
      return res.status(400).send({ message: "producto_id, cantidad y tipo son obligatorios." });
    }

    // Crear movimiento
    const mov = await Movimiento.create({ producto_id, cantidad, tipo, motivo, pedido_id }, { transaction: t });

    // Ajustar inventario
    const inv = await Inventario.findByPk(producto_id, { transaction: t });
    if (!inv) throw new Error("Inventario no encontrado.");

    let nuevo = inv.existencias;
    if (tipo === "COMPRA" || tipo === "AJUSTE") nuevo += cantidad;
    if (tipo === "VENTA") nuevo -= cantidad;
    if (nuevo < 0) throw new Error("Existencias no pueden ser negativas.");

    await inv.update({ existencias: nuevo, actualizado_en: new Date() }, { transaction: t });

    await t.commit();
    res.status(201).send({ movimiento: mov, inventario: inv });
  } catch (err) {
    await t.rollback();
    res.status(500).send({ message: err.message });
  }
};

// Read all
exports.findAll = (_req, res) => {
  Movimiento.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Movimiento.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Movimiento no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Movimiento.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Movimiento actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el movimiento con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Movimiento.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Movimiento id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el movimiento con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Movimiento.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} movimientos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
