// Importamos el modulo express 
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pagosCtrl = require("./app/controllers/pagos.controller.js");

const app = express();

const FRONT_FROM_ENV = (process.env.FRONT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ORIGENES = [
  'http://localhost:5173',
  'http://localhost:8081',
  ...FRONT_FROM_ENV, // ej: https://articulos-deportivos-fronted.onrender.com
];

const corsOptions = {
  origin: function (origin, cb) {
    // Permite llamadas sin origin (Postman/curl) y los orígenes listados
    if (!origin) return cb(null, true);
    if (ORIGENES.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
// Responder preflight con los headers CORS
app.options('*', cors(corsOptions));

/* ==============================
   STRIPE WEBHOOK: raw body SOLO para esta ruta
   Debe declararse ANTES de bodyParser.json()
   ============================== */
app.post("/api/pagos/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { req.rawBody = req.body; next(); },
  pagosCtrl.webhookStripe
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

app.get("/", (req, res) => {
  res.json({ message: "UMG Web Application" });
});


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
require("./app/routes/auth.routes.js")(app);


require("./app/routes/pagos.routes.js")(app);

//server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});