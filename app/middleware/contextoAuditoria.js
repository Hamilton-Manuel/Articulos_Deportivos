// Adjunta información del actor al request para usarla en los hooks
const crypto = require('crypto');

module.exports = (req, _res, next) => {
  req.contextoAuditoria = {
    actor_usuario_id: req.user?.id || null,
    actor_correo:     req.user?.correo || null,
    actor_ip:         req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0] || '',
    agente_usuario:   req.headers['user-agent'] || '',
    id_solicitud:     crypto.randomUUID()
  };
  next();
};
