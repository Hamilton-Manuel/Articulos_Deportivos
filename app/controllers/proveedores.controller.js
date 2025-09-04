const db = require("../models");
const Proveedor = db.proveedores;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre es obligatorio." });
  }
  const { nombre, contacto, telefono, correo, direccion } = req.body;
  Proveedor.create({ nombre, contacto, telefono, correo, direccion })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all
exports.findAll = (_req, res) => {
  Proveedor.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Proveedor.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Proveedor no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Proveedor.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Proveedor actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el proveedor con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Proveedor.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Proveedor id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el proveedor con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Proveedor.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} proveedores eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: buscar por nombre
exports.findByNombre = (req, res) => {
  const nombre = req.params.nombre;
  const operador = Op.iLike || Op.like;
  Proveedor.findAll({ where: { nombre: { [operador]: `%${nombre}%` } } })
    .then(data => data?.length ? res.send(data) : res.status(404).send({ message: "Sin resultados." }))
    .catch(err => res.status(500).send({ message: err.message }));
};
