// Importamos el modulo express 
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

/* ==============================
   CORS: permite front local (Vite 5173) y pruebas locales
   ============================== */
const ORIGENES = [
  "http://localhost:5173", // frontend (Vite por defecto)
  "http://localhost:8081"  // opcional: mismo puerto para pruebas
];
app.use(cors({
  origin: (origin, cb) => {
    // Permite herramientas como Postman (no envían origin)
    if (!origin) return cb(null, true);
    return cb(null, ORIGENES.includes(origin));
  }
}));

/* ==============================
   STRIPE WEBHOOK: raw body SOLO para esta ruta
   Debe declararse ANTES de bodyParser.json()
   ============================== */
app.post(
  "/api/pagos/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    // Guardamos el raw por si luego quieres verificar firma con Stripe
    req.rawBody = req.body;
    // Si no vas a verificar la firma aún, parseamos a JSON para usar req.body normal:
    try { req.body = JSON.parse(req.body); } catch (_) {}
    next();
  }
);

/* ==============================
   Body parsers para el resto de rutas
   ============================== */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Auditoría: contexto por solicitud (actor, ip, agente, id_solicitud)
const contextoAuditoria = require("./app/middleware/contextoAuditoria");
app.use(contextoAuditoria); 

/* ==============================
   DB y modelos
   ============================== */
const db = require("./app/models/index.js");
// db.sequelize.sync({ force: true }); // para reset total (usa con cuidado)
db.sequelize.sync(); // crea las tablas si no existen (no elimina existentes)

/* ==============================
   Ruta base
   ============================== */
app.get("/", (req, res) => {
  res.json({ message: "UMG Web Application" });
});

/* ==============================
   Rutas de la app
   (puedes dejar cine mientras pruebas)
   ============================== */
require("./app/routes/cine.routes.js")(app);

require("./app/routes/usuarios.routes.js")(app);
require("./app/routes/clientes.routes.js")(app);
require("./app/routes/empleados.routes.js")(app);
require("./app/routes/proveedores.routes.js")(app);
require("./app/routes/productos.routes.js")(app);
require("./app/routes/inventario.routes.js")(app);
require("./app/routes/movimientos_inventario.routes.js")(app);
require("./app/routes/pedidos.routes.js")(app);
require("./app/routes/detalle_pedido.routes.js")(app);

/* IMPORTANTE:
   pagos.routes define /api/pagos/checkout y /api/pagos/webhook/stripe.
   El middleware raw del webhook ya fue declarado ARRIBA, antes del bodyParser.
*/
require("./app/routes/pagos.routes.js")(app);

/* ==============================
   Server
   ============================== */
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});