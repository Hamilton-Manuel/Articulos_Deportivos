// routes/pagos.routes.js
module.exports = app => {
  const pagos = require("../controllers/pagos.controller.js");
  const router = require("express").Router();

  // ===== CRUD existente =====
  router.post("/create", pagos.create);
  router.get("/", pagos.findAll);
  router.get("/:id", pagos.findOne);
  router.put("/update/:id", pagos.update);
  router.delete("/delete/:id", pagos.delete);
  router.delete("/delete", pagos.deleteAll);

  // ===== Stripe Checkout =====
  // Crea la sesión de pago y devuelve la URL hospedada por Stripe
  router.post("/checkout", pagos.checkoutStripe);

  // Webhook de Stripe (Stripe llama aquí tras pagar con éxito)
  router.post("/webhook/stripe", pagos.webhookStripe);

  app.use("/api/pagos", router);
};
