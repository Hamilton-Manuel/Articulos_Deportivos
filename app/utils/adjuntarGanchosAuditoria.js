// Agrega hooks de auditoría a un modelo Sequelize
const { registrarAuditoria } = require('./auditoria');

function adjuntarGanchosAuditoria(modelo, modelos, nombreModulo, campoId = 'id'){
  const tabla_entidad = modelo.getTableName();

  modelo.addHook('afterCreate', async (instancia, opciones) => {
    const ctx = opciones?.req?.contextoAuditoria;
    await registrarAuditoria(modelos, ctx, {
      modulo: nombreModulo,
      tabla_entidad,
      id_entidad: instancia[campoId],
      accion: 'CREAR',
      datos_antes: null,
      datos_despues: instancia.get({ plain: true })
    });
  });

  modelo.addHook('beforeUpdate', async (instancia, opciones) => {
    opciones._imagenAntes = await modelo.findByPk(instancia[campoId], { raw: true });
  });

  modelo.addHook('afterUpdate', async (instancia, opciones) => {
    const ctx = opciones?.req?.contextoAuditoria;
    await registrarAuditoria(modelos, ctx, {
      modulo: nombreModulo,
      tabla_entidad,
      id_entidad: instancia[campoId],
      accion: 'ACTUALIZAR',
      datos_antes: opciones._imagenAntes || null,
      datos_despues: instancia.get({ plain: true })
    });
  });

  modelo.addHook('beforeDestroy', async (instancia, opciones) => {
    opciones._imagenAntes = (await modelo.findByPk(instancia[campoId], { raw: true })) || instancia.get({ plain: true });
  });

  modelo.addHook('afterDestroy', async (instancia, opciones) => {
    const ctx = opciones?.req?.contextoAuditoria;
    await registrarAuditoria(modelos, ctx, {
      modulo: nombreModulo,
      tabla_entidad,
      id_entidad: instancia[campoId],
      accion: 'ELIMINAR',
      datos_antes: opciones._imagenAntes || null,
      datos_despues: null
    });
  });
}

module.exports = { adjuntarGanchosAuditoria };
