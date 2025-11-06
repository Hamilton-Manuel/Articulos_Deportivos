module.exports = (app) => {
  const auth = require("../middlewares/auth.js");        // si ya usas auth
  const fac = require("../controllers/facturas.controller.js");
  const router = require("express").Router();

  // Descargar por session_id de Stripe (lo tienes en PagoExitoso)
  router.get("/session/:session_id.pdf", auth, fac.pdfBySession);

  // (opcional) Descargar por id de pedido
  router.get("/pedido/:id.pdf", auth, fac.pdfByPedido);

  app.use("/api/facturas", router);
};
