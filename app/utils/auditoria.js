// Utilidades de auditoría (comentarios en español)
const CAMPOS_SENSIBLES = new Set([
  'password', 'contrasena', 'hash_contrasena', 'token',
  'dpi', 'nit', 'tarjeta', 'cvv'
]);

function enmascarar(obj){
  if(!obj) return obj;
  const out = { ...obj };
  for(const k of Object.keys(out)){
    if (CAMPOS_SENSIBLES.has(k) && out[k] != null) out[k] = '[REDACTADO]';
  }
  return out;
}

function calcularClavesCambiadas(antes, despues){
  if(!antes || !despues) return Object.keys(despues || antes || {});
  const claves = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  const cambiadas = [];
  for (const c of claves){
    const a = antes?.[c];
    const b = despues?.[c];
    if (JSON.stringify(a) !== JSON.stringify(b)) cambiadas.push(c);
  }
  return cambiadas;
}

async function registrarAuditoria(modelos, contexto, payload){
  const { bitacora_auditoria } = modelos;

  const datos_antes   = enmascarar(payload.datos_antes);
  const datos_despues = enmascarar(payload.datos_despues);

  return bitacora_auditoria.create({
    fecha_evento:     new Date(),
    actor_usuario_id: contexto?.actor_usuario_id || null,
    actor_correo:     contexto?.actor_correo || null,
    actor_ip:         contexto?.actor_ip || null,
    agente_usuario:   contexto?.agente_usuario || null,
    id_solicitud:     contexto?.id_solicitud || null,

    modulo:           payload.modulo,
    tabla_entidad:    payload.tabla_entidad,
    id_entidad:       String(payload.id_entidad),
    accion:           payload.accion,
    datos_antes,
    datos_despues,
    claves_cambiadas: calcularClavesCambiadas(datos_antes, datos_despues),
    motivo:           payload.motivo || null
  });
}

module.exports = { registrarAuditoria };
