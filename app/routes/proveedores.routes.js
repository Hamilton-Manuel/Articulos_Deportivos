// routes/proveedores.routes.js
module.exports = app => {
  const proveedores = require("../controllers/proveedores.controller.js");
  const router = require("express").Router();

  router.post("/create", proveedores.create);
  router.get("/", proveedores.findAll);
  router.get("/nombre/:nombre", proveedores.findByNombre); // antes de :id
  router.get("/:id", proveedores.findOne);
  router.put("/update/:id", proveedores.update);
  router.delete("/delete/:id", proveedores.delete);
  router.delete("/delete", proveedores.deleteAll);

  app.use("/api/proveedores", router);
};
