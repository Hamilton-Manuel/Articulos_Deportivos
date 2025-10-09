// app/models/iniciarAuditoria.js
const { adjuntarGanchosAuditoria } = require('../utils/adjuntarGanchosAuditoria');

// Llama esto después de cargar TODOS tus modelos en models/index.js
function iniciarAuditoria(db){
  // === Coinciden con tus modelos reales (según tu /models e imagen de tablas) ===
  if (db.usuarios)               adjuntarGanchosAuditoria(db.usuarios,               db, 'usuarios');
  if (db.clientes)               adjuntarGanchosAuditoria(db.clientes,               db, 'clientes');
  if (db.empleados)              adjuntarGanchosAuditoria(db.empleados,              db, 'empleados');
  if (db.proveedores)            adjuntarGanchosAuditoria(db.proveedores,            db, 'proveedores');
  if (db.productos)              adjuntarGanchosAuditoria(db.productos,              db, 'productos');
  if (db.inventario)             adjuntarGanchosAuditoria(db.inventario,             db, 'inventarios');
  if (db.movimientos_inventario) adjuntarGanchosAuditoria(db.movimientos_inventario, db, 'movimientos_inventarios');
  if (db.pedidos)                adjuntarGanchosAuditoria(db.pedidos,                db, 'pedidos');
  if (db.detalle_pedido)         adjuntarGanchosAuditoria(db.detalle_pedido,         db, 'detalle_pedidos');
  if (db.pagos)                  adjuntarGanchosAuditoria(db.pagos,                  db, 'pagos');
}

module.exports = { iniciarAuditoria };
