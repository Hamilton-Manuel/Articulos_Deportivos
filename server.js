// Importamos el modulo express 
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pagosCtrl = require("./app/controllers/pagos.controller.js");

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
    req.rawBody = req.body;           // guarda el buffer crudo para verificar firma
    try { req.body = JSON.parse(req.body); } catch (_) {} // útil si NO validas firma
    next();
  },
  pagosCtrl.webhookStripe               // <<--- handler REAL del webhook
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
// ====== Páginas de prueba para Stripe Checkout ======
app.get("/api/pagos/success", (req, res) => {
  res.send("✅ Pago procesado correctamente. Puedes cerrar esta pestaña.");
});

app.get("/api/pagos/cancel", (req, res) => {
  res.send("❌ Pago cancelado. Vuelve al sitio para intentarlo de nuevo.");
});


/* ==============================
   Server
   ============================== */
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});