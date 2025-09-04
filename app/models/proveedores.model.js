// models/proveedores.model.js
module.exports = (sequelize, Sequelize) => {
  const Proveedor = sequelize.define("proveedores", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    contacto: {
      type: Sequelize.STRING
    },
    telefono: {
      type: Sequelize.STRING
    },
    correo: {
      type: Sequelize.STRING
    },
    direccion: {
      type: Sequelize.TEXT
    },
    creado_en: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, { timestamps: false });

  return Proveedor;
};
