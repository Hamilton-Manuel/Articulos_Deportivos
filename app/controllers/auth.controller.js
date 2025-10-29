const db = require("../models");
const Usuario = db.usuarios;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const SALT_ROUNDS = 10;
exports.login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).send({ message: "correo y contrasena son requeridos" });
    }

    const usuario = await Usuario.findOne({ where: { correo, activo: true } });
    if (!usuario) return res.status(401).send({ message: "Credenciales inválidas" });

    const stored = usuario.hash_contrasena || "";
    const looksBcrypt = typeof stored === "string" && stored.startsWith("$2");

    let ok = false;

    if (looksBcrypt) {
      // Caso normal
      ok = await bcrypt.compare(contrasena, stored);
    } else {
      // LEGACY: guardado en texto plano. Compara directo y si coincide, re-hash inmediata.
      if (contrasena === stored) {
        ok = true;
        const newHash = await bcrypt.hash(contrasena, 10);
        await Usuario.update({ hash_contrasena: newHash }, { where: { id: usuario.id } });
      }
    }

    if (!ok) return res.status(401).send({ message: "Credenciales inválidas" });

    const payload = { id: usuario.id, correo: usuario.correo, rol: usuario.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    return res.send({
      user: {
        id: usuario.id,
        correo: usuario.correo,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol
      },
      token
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
