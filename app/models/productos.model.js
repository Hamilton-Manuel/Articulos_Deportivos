// models/productos.model.js
module.exports = (sequelize, Sequelize) => {
  const Producto = sequelize.define("productos", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    sku: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    descripcion: {
      type: Sequelize.TEXT
    },
    proveedor_id: {                              // añadido a petición
      type: Sequelize.UUID,
      references: { model: "proveedores", key: "id" },
      onDelete: "SET NULL"
    },
    precio_costo: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    precio_venta: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    activo: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Producto;
};
