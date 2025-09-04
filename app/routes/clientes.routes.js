// routes/clientes.routes.js
module.exports = app => {
  const clientes = require("../controllers/clientes.controller.js");
  const router = require("express").Router();

  router.post("/create", clientes.create);
  router.get("/", clientes.findAll);
  router.get("/correo/:correo", clientes.findByCorreo); // antes de :id
  router.get("/:id", clientes.findOne);
  router.put("/update/:id", clientes.update);
  router.delete("/delete/:id", clientes.delete);
  router.delete("/delete", clientes.deleteAll);

  app.use("/api/clientes", router);
};
