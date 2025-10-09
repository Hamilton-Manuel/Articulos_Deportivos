const db = require("../models");
const Usuario = db.usuarios;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  const { correo, hash_contrasena, nombre_completo, rol, activo } = req.body;
  if (!correo || !hash_contrasena || !nombre_completo) {
    return res.status(400).send({ message: "correo, hash_contrasena y nombre_completo son obligatorios." });
  }

  const item = { correo, hash_contrasena, nombre_completo, rol, activo };
  Usuario.create(item,{ req })
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// buscar todos
exports.findAll = (_req, res) => {
  Usuario.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// buscar por id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Usuario.findByPk(id)
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Usuario no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Usuario.update(req.body, { where: { id },individualHooks: true, req  })
    .then(([count]) => count == 1
      ? res.send({ message: "Usuario actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el usuario con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Usuario.destroy({ where: { id }, individualHooks: true, req })
    .then(count => count == 1
      ? res.status(200).send({ message: `Usuario id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el usuario con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Usuario.destroy({ where: {}, truncate: false,individualHooks: true, req })
    .then(nums => res.send({ message: `${nums} usuarios eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: buscar por correo (like/ilike)
exports.findByCorreo = (req, res) => {
  const correo = req.params.correo;
  const operador = Op.iLike || Op.like;
  Usuario.findAll({ where: { correo: { [operador]: `%${correo}%` } } })
    .then(data => data?.length ? res.send(data) : res.status(404).send({ message: "Sin resultados." }))
    .catch(err => res.status(500).send({ message: err.message }));
};
