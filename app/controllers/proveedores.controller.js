const db = require("../models");
const Proveedor = db.proveedores;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre es obligatorio." });
  }
  const { nombre, contacto, telefono, correo, direccion } = req.body;
  Proveedor.create({ nombre, contacto, telefono, correo, direccion },{req})
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// buscar todos
exports.findAll = (_req, res) => {
  Proveedor.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// buscar por id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Proveedor.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Proveedor no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Proveedor.update(req.body, { where: { id }, individualHooks: true, req })
    .then(([count]) => count == 1
      ? res.send({ message: "Proveedor actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el proveedor con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Proveedor.destroy({ where: { id }, individualHooks: true, req })
    .then(count => count == 1
      ? res.status(200).send({ message: `Proveedor id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el proveedor con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Proveedor.destroy({ where: {}, truncate: false, individualHooks: true, req })
    .then(nums => res.send({ message: `${nums} proveedores eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: buscar por nombre (solo columna `nombre`)
exports.findByNombre = async (req, res) => {
  const { Op } = db.Sequelize;

  // Normaliza entrada
  const raw = (req.params.nombre || "").trim();
  if (!raw) return res.status(400).json({ message: "Parámetro nombre vacío." });

  try {
    const filas = await Proveedor.findAll({
      where: {
        nombre: { [Op.iLike]: `%${raw}%` }   // Postgres case-insensitive
      },
      attributes: ["id", "nombre", "contacto", "correo", "telefono"],
      limit: 10,
      order: [["nombre", "ASC"]]
    });

    if (!filas.length) return res.status(404).json({ message: "Sin resultados." });
    res.json(filas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
