// routes/detalle_pedido.routes.js
module.exports = app => {
  const detalle = require("../controllers/detalle_pedido.controller.js");
  const router = require("express").Router();

  router.post("/create", detalle.create);
  router.get("/", detalle.findAll);
  router.get("/:id", detalle.findOne);
  router.put("/update/:id", detalle.update);
  router.delete("/delete/:id", detalle.delete);
  router.delete("/delete", detalle.deleteAll);

  app.use("/api/detalle-pedido", router);
};
