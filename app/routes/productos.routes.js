// routes/productos.routes.js
module.exports = app => {
  const productos = require("../controllers/productos.controller.js");
  const router = require("express").Router();

  router.post("/create", productos.create);
  router.get("/", productos.findAll);
  router.get("/nombre/:nombre", productos.findByNombre); // antes de :id
  router.get("/sku/:sku", productos.findBySku);          // antes de :id
  router.get("/:id", productos.findOne);
  router.put("/update/:id", productos.update);
  router.delete("/delete/:id", productos.delete);
  router.delete("/delete", productos.deleteAll);

  app.use("/api/productos", router);
};
