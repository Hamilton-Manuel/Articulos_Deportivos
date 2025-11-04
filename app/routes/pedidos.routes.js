// routes/pedidos.routes.js
module.exports = app => {
  const pedidos = require("../controllers/pedidos.controller.js");
  const router = require("express").Router();
  const auth = require("../middleware/auth"); // <- NUEVO

  router.post("/create", pedidos.create);
  router.post("/crear-con-detalle", pedidos.crearConDetalle);

  // === NUEVO: Carrito/Checkout (requieren JWT) ===
  router.get("/open", auth, pedidos.open);
  router.post("/sync", auth, pedidos.sync);
 
  router.get("/", pedidos.findAll);
  router.put("/update/:id", pedidos.update);
  router.delete("/delete/:id", pedidos.delete);
  router.delete("/delete", pedidos.deleteAll);
  router.get("/:id", pedidos.findOne);

  app.use("/api/pedidos", router);
};
