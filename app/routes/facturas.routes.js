module.exports = (app) => {
  const auth = require("../middleware/auth.js");        // si ya usas auth
  const fac = require("../controllers/facturas.controller.js");
  const router = require("express").Router();

  router.get("/session/:session_id.pdf", auth, fac.pdfBySession);
  router.get("/pedido/:id.pdf", auth, fac.pdfByPedido);

  app.use("/api/facturas", router);
};
