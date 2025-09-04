const db = require("../models");
const Pago = db.pagos;

// Create
exports.create = (req, res) => {
  const { pedido_id, proveedor_pago, intento_id, monto, moneda, estado } = req.body;
  if (!pedido_id || !proveedor_pago || monto == null) {
    return res.status(400).send({ message: "pedido_id, proveedor_pago y monto son obligatorios." });
  }

  Pago.create({ pedido_id, proveedor_pago, intento_id, monto, moneda, estado })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all
exports.findAll = (_req, res) => {
  Pago.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Pago.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Pago no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Pago.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Pago actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el pago con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Pago.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Pago id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el pago con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Pago.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} pagos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
