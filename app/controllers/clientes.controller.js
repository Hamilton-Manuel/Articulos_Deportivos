const db = require("../models");
const Cliente = db.clientes;
const Usuario = db.usuarios;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  const { usuario_id, correo, telefono, direccion_envio, direccion_facturacion } = req.body;
  const item = { usuario_id, correo, telefono, direccion_envio, direccion_facturacion };

  Cliente.create(item)
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read all (incluye usuario si existe)
exports.findAll = (_req, res) => {
  Cliente.findAll({ include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;
  Cliente.findByPk(id, { include: [{ model: Usuario, attributes: ["id", "correo", "nombre_completo", "rol"] }] })
    .then(data => data ? res.send(data) : res.status(404).send({ message: "Cliente no encontrado." }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;
  Cliente.update(req.body, { where: { id } })
    .then(([count]) => count == 1
      ? res.send({ message: "Cliente actualizado." })
      : res.status(404).send({ message: `No se pudo actualizar el cliente con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;
  Cliente.destroy({ where: { id } })
    .then(count => count == 1
      ? res.status(200).send({ message: `Cliente id=${id} eliminado.` })
      : res.status(404).send({ message: `No se pudo eliminar el cliente con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Cliente.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} clientes eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: buscar por correo
exports.findByCorreo = (req, res) => {
  const correo = req.params.correo;
  const operador = Op.iLike || Op.like;
  Cliente.findAll({ where: { correo: { [operador]: `%${correo}%` } } })
    .then(data => data?.length ? res.send(data) : res.status(404).send({ message: "Sin resultados." }))
    .catch(err => res.status(500).send({ message: err.message }));
};
