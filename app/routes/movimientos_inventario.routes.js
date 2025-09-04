// routes/movimientos_inventario.routes.js
module.exports = app => {
  const movs = require("../controllers/movimientos_inventario.controller.js");
  const router = require("express").Router();

  router.post("/create", movs.create);       // solo registra el movimiento
  router.post("/registrar", movs.registrar); // registra + actualiza inventario en TX

  router.get("/", movs.findAll);
  router.get("/:id", movs.findOne);
  router.put("/update/:id", movs.update);
  router.delete("/delete/:id", movs.delete);
  router.delete("/delete", movs.deleteAll);

  app.use("/api/movimientos-inventario", router);
};
