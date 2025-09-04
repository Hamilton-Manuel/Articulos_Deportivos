// models/detalle_pedido.model.js
module.exports = (sequelize, Sequelize) => {
  const DetallePedido = sequelize.define("detalle_pedido", {
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
    producto_id: {
      type: Sequelize.UUID,
      references: { model: "productos", key: "id" }
    },
    cantidad: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    precio_unitario: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    // Nota: en Postgres puedes generar este campo en una migración SQL;
    // aquí lo guardaremos explícitamente desde el controlador/servicio.
    total_linea: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    }
  }, { timestamps: false });

  return DetallePedido;
};
