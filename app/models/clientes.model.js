// models/clientes.model.js
module.exports = (sequelize, Sequelize) => {
  const Cliente = sequelize.define("clientes", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    usuario_id: {
      type: Sequelize.UUID,
      unique: true,
      references: { model: "usuarios", key: "id" },
      onDelete: "SET NULL"
    },
    correo: {                 // añadido a petición
      type: Sequelize.STRING,
      allowNull: true
    },
    telefono: {
      type: Sequelize.STRING
    },
    direccion_envio: {
      type: Sequelize.TEXT
    },
    direccion_facturacion: {
      type: Sequelize.TEXT
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Cliente;
};
