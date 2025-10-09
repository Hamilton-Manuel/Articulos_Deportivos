// controllers/detalle_pedido.controller.js
const db = require("../models");
const Detalle = db.detalle_pedido;
const Pedido = db.pedidos;
const Producto = db.productos;
const Inventario = db.inventario;

// helpers
const esEnteroPositivo = (n) => Number.isInteger(Number(n)) && Number(n) > 0;

// Create con validaciones contra encabezado, producto e inventario
exports.create = async (req, res) => {
  try {
    const { pedido_id, producto_id, cantidad } = req.body;

    // 1) Validaciones básicas
    if (!pedido_id || !producto_id || cantidad == null) {
      return res.status(400).send({ message: "pedido_id, producto_id y cantidad son obligatorios." });
    }
    if (!esEnteroPositivo(cantidad)) {
      return res.status(400).send({ message: "cantidad debe ser un entero > 0." });
    }

    // 2) Pedido debe existir y NO estar PAGADO
    const pedido = await Pedido.findByPk(pedido_id);
    if (!pedido) {
      return res.status(404).send({ message: "Pedido no encontrado." });
    }
    if (pedido.estado === "PAGADO") {
      return res.status(400).send({ message: "No se pueden agregar detalles a un pedido PAGADO." });
    }

    // 3) Producto debe existir y estar activo
    const prod = await Producto.findByPk(producto_id);
    if (!prod || !prod.activo) {
      return res.status(404).send({ message: "Producto no encontrado o inactivo." });
    }

    // 4) Verificar inventario disponible (no descontamos aquí, solo validamos)
    const inv = await Inventario.findByPk(producto_id);
    const disponible = inv ? Number(inv.existencias) : 0;
    if (disponible < Number(cantidad)) {
      return res.status(400).send({ message: `Stock insuficiente para '${prod.nombre}'. Disponible: ${disponible}.` });
    }

    // 5) Tomar precio_unitario desde BD (precio_venta del producto)
    const precio_unitario = Number(prod.precio_venta);
    const total_linea = precio_unitario * Number(cantidad);

    // 6) Crear detalle
    const data = await Detalle.create({
      pedido_id,
      producto_id,
      cantidad: Number(cantidad),
      precio_unitario,
      total_linea
    });

    // 7) (Opcional) recalcular totales del encabezado con todos los detalles actuales
    const detalles = await Detalle.findAll({ where: { pedido_id } });
    const nuevo_subtotal = detalles.reduce((acc, d) => acc + Number(d.total_linea), 0);
    const nuevo_impuestos = 0; // ajusta si usarás IVA
    const nuevo_total = nuevo_subtotal + nuevo_impuestos;
    await pedido.update({ subtotal: nuevo_subtotal, impuestos: nuevo_impuestos, total: nuevo_total });

    return res.status(201).send(data);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
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

// Update con reglas: no permitir cambios si pedido está PAGADO; validar cantidad; precio desde BD
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const detalle = await Detalle.findByPk(id);
    if (!detalle) {
      return res.status(404).send({ message: `Detalle id=${id} no existe.` });
    }

    // Traer pedido para validar estado
    const pedido = await Pedido.findByPk(detalle.pedido_id);
    if (!pedido) {
      return res.status(404).send({ message: "Pedido del detalle no existe." });
    }
    if (pedido.estado === "PAGADO") {
      return res.status(400).send({ message: "No se pueden modificar detalles de un pedido PAGADO." });
    }

    // Solo permitimos actualizar cantidad (precio siempre viene de producto)
    const body = {};
    if (req.body.cantidad != null) {
      if (!esEnteroPositivo(req.body.cantidad)) {
        return res.status(400).send({ message: "cantidad debe ser un entero > 0." });
      }

      // Verificar inventario disponible de nuevo
      const inv = await Inventario.findByPk(detalle.producto_id);
      const disponible = inv ? Number(inv.existencias) : 0;
      if (disponible < Number(req.body.cantidad)) {
        return res.status(400).send({ message: `Stock insuficiente. Disponible: ${disponible}.` });
      }

      // Traer precio del producto otra vez (por si cambió)
      const prod = await Producto.findByPk(detalle.producto_id);
      if (!prod || !prod.activo) {
        return res.status(404).send({ message: "Producto no encontrado o inactivo." });
      }

      const precio_unitario = Number(prod.precio_venta);
      body.cantidad = Number(req.body.cantidad);
      body.precio_unitario = precio_unitario;
      body.total_linea = precio_unitario * Number(req.body.cantidad);
    }

    if (Object.keys(body).length === 0) {
      return res.status(400).send({ message: "No hay campos válidos para actualizar (solo 'cantidad')." });
    }

    const [count] = await Detalle.update(body, { where: { id } });
    if (count !== 1) {
      return res.status(500).send({ message: "No se pudo actualizar el detalle." });
    }

    // Recalcular totales de la cabecera
    const detalles = await Detalle.findAll({ where: { pedido_id: pedido.id } });
    const nuevo_subtotal = detalles.reduce((acc, d) => acc + Number(d.total_linea), 0);
    const nuevo_impuestos = 0;
    const nuevo_total = nuevo_subtotal + nuevo_impuestos;
    await pedido.update({ subtotal: nuevo_subtotal, impuestos: nuevo_impuestos, total: nuevo_total });

    return res.send({ message: "Detalle actualizado." });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// Delete (y recalcula totales del pedido)
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const detalle = await Detalle.findByPk(id);
    if (!detalle) {
      return res.status(404).send({ message: `Detalle id=${id} no existe.` });
    }

    // No permitir borrar si pedido está PAGADO
    const pedido = await Pedido.findByPk(detalle.pedido_id);
    if (!pedido) {
      return res.status(404).send({ message: "Pedido del detalle no existe." });
    }
    if (pedido.estado === "PAGADO") {
      return res.status(400).send({ message: "No se pueden eliminar detalles de un pedido PAGADO." });
    }

    const count = await Detalle.destroy({ where: { id } });
    if (count !== 1) {
      return res.status(500).send({ message: "No se pudo eliminar el detalle." });
    }

    // Recalcular totales del pedido
    const restantes = await Detalle.findAll({ where: { pedido_id: pedido.id } });
    const nuevo_subtotal = restantes.reduce((acc, d) => acc + Number(d.total_linea), 0);
    const nuevo_impuestos = 0;
    const nuevo_total = nuevo_subtotal + nuevo_impuestos;
    await pedido.update({ subtotal: nuevo_subtotal, impuestos: nuevo_impuestos, total: nuevo_total });

    return res.status(200).send({ message: `Detalle id=${id} eliminado.` });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// Delete all (administrativo; no recomendado en producción)
exports.deleteAll = (_req, res) => {
  Detalle.destroy({ where: {}, truncate: false })
    .then(nums => res.send({ message: `${nums} detalles eliminados.` }))
    .catch(err => res.status(500).send({ message: err.message }));
};
