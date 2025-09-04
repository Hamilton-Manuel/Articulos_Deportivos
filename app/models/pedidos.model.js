// models/pedidos.model.js
module.exports = (sequelize, Sequelize) => {
  const Pedido = sequelize.define("pedidos", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    cliente_id: {
      type: Sequelize.UUID,
      references: { model: "clientes", key: "id" },
      onDelete: "SET NULL"
    },
    direccion_envio: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    estado: {
      type: Sequelize.ENUM("PENDIENTE", "PAGADO", "CANCELADO", "ENVIADO"),
      allowNull: false,
      defaultValue: "PENDIENTE"
    },
    subtotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuestos: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Pedido;
};
