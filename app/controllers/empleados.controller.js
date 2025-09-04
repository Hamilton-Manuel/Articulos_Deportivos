const db = require("../models");
const Empleado = db.empleados;
const Usuario = db.usuarios;

// Create
exports.create = (req, res) => {
  const { usuario_id, puesto, fecha_contratacion, activo } = req.body;
  const item = { usuario_id, puesto, fecha_contratacion, activo };

  Empleado.create(item)
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all (incluye usuario si existe)
exports.findAll = (_req, res) => {
  Empleado.findAll({ include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Empleado.findByPk(id, { include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }] })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Empleado no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Empleado.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Empleado actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el empleado con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Empleado.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Empleado id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el empleado con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Empleado.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} empleados eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
