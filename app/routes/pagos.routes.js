// routes/pagos.routes.js
module.exports = app => {
  const pagos = require("../controllers/pagos.controller.js");
  const router = require("express").Router();

  //  páginas de retorno (antes de /:id)
  router.get("/success", (_req, res) => res.send("✅ Pago procesado correctamente. Puedes cerrar esta pestaña."));
  router.get("/cancel",  (_req, res) => res.send("❌ Pago cancelado. Vuelve al sitio para intentarlo de nuevo."));

  // CRUD
  router.post("/create", pagos.create);
  router.get("/", pagos.findAll);
  router.put("/update/:id", pagos.update);
  router.delete("/delete/:id", pagos.delete);
  router.delete("/delete", pagos.deleteAll);

  // Checkout
  router.post("/checkout", pagos.checkoutStripe);

  // Obtener un pago por ID (al final para evitar conflictos con /success y /cancel)
  router.get("/:id", pagos.findOne);

  app.use("/api/pagos", router);
};
