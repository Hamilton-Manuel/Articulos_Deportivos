// routes/inventario.routes.js
module.exports = app => {
  const inventario = require("../controllers/inventario.controller.js");
  const router = require("express").Router();

  // Nota: la PK es producto_id (no id normal)
  router.post("/create", inventario.create);
  router.get("/", inventario.findAll);
  router.get("/:producto_id", inventario.findOne);
  router.put("/update/:producto_id", inventario.update);
  router.delete("/delete/:producto_id", inventario.delete);
  router.delete("/delete", inventario.deleteAll);

  app.use("/api/inventario", router);
};
