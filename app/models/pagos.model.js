// models/pagos.model.js
module.exports = (sequelize, Sequelize) => {
  const Pago = sequelize.define("pagos", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    pedido_id: {
      type: Sequelize.UUID,
      references: { model: "pedidos", key: "id" },
      onDelete: "CASCADE"
    },
    proveedor_pago: {
      type: Sequelize.ENUM("stripe", "paypal"),
      allowNull: false
    },
    intento_id: {
      type: Sequelize.TEXT
    },
    monto: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    moneda: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "USD"
    },
    estado: {
      type: Sequelize.ENUM("REQUIERE_PAGO", "PAGADO", "FALLIDO"),
      allowNull: false,
      defaultValue: "REQUIERE_PAGO"
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Pago;
};
