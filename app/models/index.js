// models/index.js

// Cargamos el archivo de configuración con los datos de conexión
const dbConfig = require("../config/db.config.js");

// Importamos Sequelize
const Sequelize = require("sequelize");

// Creamos la instancia de Sequelize con los parámetros de conexión
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  // Configuración SSL (si tu base lo requiere, como NeonDB o Render)
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  // Configuración del pool de conexiones
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

// Objeto `db` para exportar
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importamos y registramos el modelo de cine
db.cines = require("./cine.model.js")(sequelize, Sequelize);

// === Modelos reales del sistema ===
db.usuarios               = require("./usuarios.model.js")(sequelize, Sequelize);
db.clientes               = require("./clientes.model.js")(sequelize, Sequelize);
db.empleados              = require("./empleados.model.js")(sequelize, Sequelize);
db.proveedores            = require("./proveedores.model.js")(sequelize, Sequelize);
db.productos              = require("./productos.model.js")(sequelize, Sequelize);
db.inventario             = require("./inventario.model.js")(sequelize, Sequelize);
db.movimientos_inventario = require("./movimientos_inventario.model.js")(sequelize, Sequelize);
db.pedidos                = require("./pedidos.model.js")(sequelize, Sequelize);
db.detalle_pedido         = require("./detalle_pedido.model.js")(sequelize, Sequelize);
db.pagos                  = require("./pagos.model.js")(sequelize, Sequelize);

// === Asociaciones ===
// Usuario 1–1 Cliente / Empleado
db.usuarios.hasOne(db.clientes,  { foreignKey: "usuario_id" });
db.clientes.belongsTo(db.usuarios, { foreignKey: "usuario_id" });

db.usuarios.hasOne(db.empleados, { foreignKey: "usuario_id" });
db.empleados.belongsTo(db.usuarios, { foreignKey: "usuario_id" });

// Proveedor 1–N Productos
db.proveedores.hasMany(db.productos, { foreignKey: "proveedor_id" });
db.productos.belongsTo(db.proveedores, { foreignKey: "proveedor_id" });

// Producto 1–1 Inventario
db.productos.hasOne(db.inventario, { foreignKey: "producto_id", onDelete: "CASCADE" });
db.inventario.belongsTo(db.productos, { foreignKey: "producto_id" });

// Producto 1–N MovimientosInventario
db.productos.hasMany(db.movimientos_inventario, { foreignKey: "producto_id", onDelete: "CASCADE" });
db.movimientos_inventario.belongsTo(db.productos, { foreignKey: "producto_id" });

// Cliente 1–N Pedidos
db.clientes.hasMany(db.pedidos, { foreignKey: "cliente_id" });
db.pedidos.belongsTo(db.clientes, { foreignKey: "cliente_id" });

// Pedido 1–N DetallePedido
db.pedidos.hasMany(db.detalle_pedido, { foreignKey: "pedido_id", onDelete: "CASCADE" });
db.detalle_pedido.belongsTo(db.pedidos, { foreignKey: "pedido_id" });

// Producto 1–N DetallePedido
db.productos.hasMany(db.detalle_pedido, { foreignKey: "producto_id" });
db.detalle_pedido.belongsTo(db.productos, { foreignKey: "producto_id" });

// Pedido 1–N Pagos
db.pedidos.hasMany(db.pagos, { foreignKey: "pedido_id", onDelete: "CASCADE" });
db.pagos.belongsTo(db.pedidos, { foreignKey: "pedido_id" });

module.exports = db;