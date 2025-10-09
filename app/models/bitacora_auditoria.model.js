// Comentarios en español
module.exports = (sequelize, DataTypes) => {
  const BitacoraAuditoria = sequelize.define('bitacora_auditoria', {
    id:               { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    fecha_evento:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    actor_usuario_id: { type: DataTypes.UUID },
    actor_correo:     { type: DataTypes.TEXT },
    actor_ip:         { type: DataTypes.STRING },
    agente_usuario:   { type: DataTypes.TEXT },
    id_solicitud:     { type: DataTypes.STRING },

    modulo:           { type: DataTypes.STRING, allowNull: false },
    tabla_entidad:    { type: DataTypes.STRING, allowNull: false },
    id_entidad:       { type: DataTypes.STRING, allowNull: false },
    accion:           { type: DataTypes.ENUM('CREAR','ACTUALIZAR','ELIMINAR','LOGIN','LOGOUT','RESTAURAR'), allowNull: false },

    datos_antes:      { type: DataTypes.JSONB },
    datos_despues:    { type: DataTypes.JSONB },
    claves_cambiadas: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    motivo:           { type: DataTypes.TEXT }
  }, {
    tableName: 'bitacora_auditoria',
    timestamps: false
  });

  return BitacoraAuditoria;
};
