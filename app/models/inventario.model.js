// models/inventario.model.js
module.exports = (sequelize, Sequelize) => {
  const Inventario = sequelize.define("inventario", {
    producto_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      references: { model: "productos", key: "id" },
      onDelete: "CASCADE"
    },
    existencias: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    minimo: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    actualizado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Inventario;
};
