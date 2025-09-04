// routes/pedidos.routes.js
module.exports = app => {
  const pedidos = require("../controllers/pedidos.controller.js");
  const router = require("express").Router();

  router.post("/create", pedidos.create);
  router.post("/crear-con-detalle", pedidos.crearConDetalle);

  router.get("/", pedidos.findAll);
  router.get("/:id", pedidos.findOne);
  router.put("/update/:id", pedidos.update);
  router.delete("/delete/:id", pedidos.delete);
  router.delete("/delete", pedidos.deleteAll);

  app.use("/api/pedidos", router);
};
