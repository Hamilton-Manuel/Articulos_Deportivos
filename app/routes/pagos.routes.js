// routes/pagos.routes.js
module.exports = app => {
  const pagos = require("../controllers/pagos.controller.js");
  const router = require("express").Router();

  router.post("/create", pagos.create);
  router.get("/", pagos.findAll);
  router.get("/:id", pagos.findOne);
  router.put("/update/:id", pagos.update);
  router.delete("/delete/:id", pagos.delete);
  router.delete("/delete", pagos.deleteAll);

  app.use("/api/pagos", router);
};
