// models/usuarios.model.js
module.exports = (sequelize, Sequelize) => {
  const Usuario = sequelize.define("usuarios", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    correo: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    hash_contrasena: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    nombre_completo: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    rol: {
      type: Sequelize.ENUM("ADMIN", "EMPLEADO", "CLIENTE"),
      allowNull: false,
      defaultValue: "CLIENTE"
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

  return Usuario;
};
