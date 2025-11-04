// middlewares/auth.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

module.exports = (req, res, next) => {
  try {
    const h = req.headers["authorization"] || "";
       if (!h) {
     return res.status(401).send({ message: "No autorizado: falta header Authorization." });
   }
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).send({ message: "No autorizado: falta token." });

    const payload = jwt.verify(token, JWT_SECRET);
    // Lo importante: poblar req.user para los controladores de pedidos
    req.user = { id: payload.id, correo: payload.correo, rol: payload.rol };

    return next();
  } catch (err) {
    console.error("[AUTH] JWT verify error:", err && err.message);

    return res.status(401).send({ message: "Token inválido o expirado." });
  }
};
