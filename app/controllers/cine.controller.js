// controllers/cine.controller.js
const db = require("../models");
const Cine = db.cines;
const Op = db.Sequelize.Op;

// Create
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre es obligatorio." });
  }

  const item = {
    nombre: req.body.nombre,
    sinopsis: req.body.sinopsis,
    actores: req.body.actores,
    duracion: req.body.duracion,
    tipo: req.body.tipo,
    categoria: req.body.categoria,
    anio_lanzamiento: req.body.anio_lanzamiento,
    puntuacion: req.body.puntuacion // <-- campo adicional requerido por el ingeniero att hamilton
  };

  Cine.create(item)
    .then(data => res.status(201).send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};


// Read all
exports.findAll = (_req, res) => {
  Cine.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Read one by id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Cine.findByPk(id)
    .then(data =>
      data ? res.send(data) : res.status(404).send({ message: "Contenido no encontrado." })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Update by id
exports.update = (req, res) => {
  const id = req.params.id;
  Cine.update(req.body, { where: { id } })
    .then(([count]) =>
      count == 1
        ? res.send({ message: "Contenido actualizado exitosamente." })
        : res.status(404).send({ message: `No se pudo actualizar el contenido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete by id
exports.delete = (req, res) => {
  const id = req.params.id;
  Cine.destroy({ where: { id } })
    .then(count =>
      count == 1
        ? res.status(200).send({ message: `Contenido con id=${id} eliminado exitosamente.` })
        : res.status(404).send({ message: `No se pudo eliminar el contenido con id=${id}.` })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};

// Delete all
exports.deleteAll = (_req, res) => {
  Cine.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} contenidos eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Extra: Read by name
exports.findByName = (req, res) => {
  const nombre = req.params.nombre;
  const operador = Op.iLike || Op.like; // iLike si existe (Postgres), sino like

  Cine.findAll({
    where: { nombre: { [operador]: `%${nombre}%` } }
  })
    .then(data =>
      data && data.length
        ? res.send(data)
        : res.status(404).send({ message: "No se encontraron resultados para ese nombre." })
    )
    .catch(err => res.status(500).send({ message: err.message }));
};
