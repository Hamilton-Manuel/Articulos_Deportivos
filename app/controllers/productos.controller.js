const db = require("../models");
const Producto = db.productos;
const Proveedor = db.proveedores;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  const { sku, nombre, descripcion, proveedor_id, precio_costo, precio_venta, activo } = req.body;
  if (!sku || !nombre || precio_costo == null || precio_venta == null) {
    return res.status(400).send({ message: "sku, nombre, precio_costo y precio_venta son obligatorios." });
  }

  const item = { sku, nombre, descripcion, proveedor_id, precio_costo, precio_venta, activo };
  Producto.create(item)
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all (incluye proveedor)
exports.findAll = (_req, res) => {
  Producto.findAll({ include: [{ model: Proveedor, attributes: ["id", "nombre"] }] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Producto.findByPk(id, { include: [{ model: Proveedor, attributes: ["id", "nombre"] }] })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Producto no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Producto.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Producto actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el producto con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Producto.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Producto id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el producto con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Producto.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} productos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: buscar por nombre o sku
exports.findByNombre = (req, res) => {
  const nombre = req.params.nombre;
  const operador = Op.iLike || Op.like;
  Producto.findAll({ where: { nombre: { [operador]: `%${nombre}%` } } })
    .then(data => data?.length ? res.send(data) : res.status(404).send({ message: "Sin resultados." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.findBySku = (req, res) => {
  const sku = req.params.sku;
  Producto.findOne({ where: { sku } })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "SKU no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};
