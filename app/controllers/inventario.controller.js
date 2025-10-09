// controllers/inventario.controller.js
const db = require("../models");
const Inventario = db.inventario;
const Producto = db.productos;

// Helpers de validación
const esEntero = (n) => Number.isInteger(Number(n));
const esEnteroPositivo = (n) => esEntero(n) && Number(n) > 0;
const esEnteroNoNegativo = (n) => esEntero(n) && Number(n) >= 0;

// Create
exports.create = async (req, res) => {
  try {
    const { producto_id, existencias, minimo } = req.body;

    // 1) producto_id requerido
    if (!producto_id) {
      return res.status(400).send({ message: "producto_id es obligatorio." });
    }

    // 2) Validar que el producto exista
    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).send({ message: "El producto no existe." });
    }

    // 3) Validar existencias (>0) y minimo (>=0)
    const ex = existencias ?? 0;
    const mi = minimo ?? 0;

    if (!esEnteroPositivo(ex)) {
      return res.status(400).send({ message: "existencias debe ser un entero > 0." });
    }
    if (!esEnteroNoNegativo(mi)) {
      return res.status(400).send({ message: "minimo debe ser un entero >= 0." });
    }

    // 4) Evitar duplicado (PK es producto_id, pero devolvemos 409 amigable)
    const yaExiste = await Inventario.findByPk(producto_id);
    if (yaExiste) {
      return res.status(409).send({ message: "Ya existe inventario para este producto." });
    }

    const item = { producto_id, existencias: Number(ex), minimo: Number(mi) };
    const data = await Inventario.create(item);
    return res.status(201).send(data);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
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

// Update (solo permite existencias > 0 y minimo >= 0)
exports.update = async (req, res) => {
  try {
    const producto_id = req.params.producto_id;

    // Validar que exista el registro de inventario
    const inv = await Inventario.findByPk(producto_id);
    if (!inv) {
      return res.status(404).send({ message: `No existe inventario para producto_id=${producto_id}.` });
    }

    const updates = {};

    // Si viene existencias, validar > 0 (no tiene sentido dejar 0 o negativo)
    if (req.body.existencias !== undefined) {
      if (!esEnteroPositivo(req.body.existencias)) {
        return res.status(400).send({ message: "existencias debe ser un entero > 0." });
      }
      updates.existencias = Number(req.body.existencias);
    }

    // Si viene minimo, validar >= 0
    if (req.body.minimo !== undefined) {
      if (!esEnteroNoNegativo(req.body.minimo)) {
        return res.status(400).send({ message: "minimo debe ser un entero >= 0." });
      }
      updates.minimo = Number(req.body.minimo);
    }

    // Si no viene nada actualizable
    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ message: "No hay campos válidos para actualizar." });
    }

    updates.actualizado_en = new Date();

    const [count] = await Inventario.update(updates, { where: { producto_id } });
    return (count === 1)
      ? res.send({ message: "Inventario actualizado." })
      : res.status(500).send({ message: "No se pudo actualizar el inventario." });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
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
