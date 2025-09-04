const db = require("../models");
const Detalle = db.detalle_pedido;

// Create
exports.create = (req, res) => {
  const { pedido_id, producto_id, cantidad, precio_unitario } = req.body;
  if (!pedido_id || !producto_id || !cantidad || precio_unitario == null) {
    return res.status(400).send({ message: "pedido_id, producto_id, cantidad y precio_unitario son obligatorios." });
  }

  const total_linea = Number(cantidad) * Number(precio_unitario);
  Detalle.create({ pedido_id, producto_id, cantidad, precio_unitario, total_linea })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all
exports.findAll = (_req, res) => {
  Detalle.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Detalle.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Detalle no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  const body = { ...req.body };
  if (body.cantidad != null && body.precio_unitario != null) {
    body.total_linea = Number(body.cantidad) * Number(body.precio_unitario);
  }
  Detalle.update(body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Detalle actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el detalle con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Detalle.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Detalle id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el detalle con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Detalle.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} detalles eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
