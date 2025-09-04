const db = require("../models");
const Inventario = db.inventario;
const Producto = db.productos;

// Create
exports.create = (req, res) => {
  const { producto_id, existencias, minimo } = req.body;
  if (!producto_id) return res.status(400).send({ message: "producto_id es obligatorio." });

  const item = { producto_id, existencias: existencias ?? 0, minimo: minimo ?? 0 };
  Inventario.create(item)
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all
exports.findAll = (_req, res) => {
  Inventario.findAll({ include: [{ model: Producto, attributes: ["id", "sku", "nombre"] }] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const producto_id = req.params.producto_id;
  Inventario.findByPk(producto_id, { include: [{ model: Producto, attributes: ["id", "sku", "nombre"] }] })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Inventario no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const producto_id = req.params.producto_id;
  Inventario.update(req.body, { where: { producto_id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Inventario actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar inventario de producto_id=${producto_id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const producto_id = req.params.producto_id;
  Inventario.destroy({ where: { producto_id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Inventario de producto_id=${producto_id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el inventario.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Inventario.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} registros de inventario eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
