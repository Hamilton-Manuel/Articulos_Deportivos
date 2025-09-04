// models/movimientos_inventario.model.js
module.exports = (sequelize, Sequelize) => {
  const MovimientoInventario = sequelize.define("movimientos_inventario", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    producto_id: {
      type: Sequelize.UUID,
      references: { model: "productos", key: "id" },
      onDelete: "CASCADE"
    },
    cantidad: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    tipo: {
      type: Sequelize.ENUM("COMPRA", "AJUSTE", "VENTA"),
      allowNull: false
    },
    motivo: {
      type: Sequelize.TEXT
    },
    pedido_id: {
      type: Sequelize.UUID
      // opcional: references pedidos
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return MovimientoInventario;
};
