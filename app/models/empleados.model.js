// models/empleados.model.js
module.exports = (sequelize, Sequelize) => {
  const Empleado = sequelize.define("empleados", {
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
    puesto: {
      type: Sequelize.STRING
    },
    fecha_contratacion: {
      type: Sequelize.DATEONLY
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

  return Empleado;
};
