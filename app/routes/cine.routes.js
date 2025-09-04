// routes/cine.routes.js
module.exports = app => {
  const cine = require("../controllers/cine.controller.js");
  const router = require("express").Router();

  router.post("/create", cine.create);
  router.get("/", cine.findAll);
  router.get("/nombre/:nombre", cine.findByName); // antes de :id
  router.get("/:id", cine.findOne);
  router.put("/update/:id", cine.update);
  router.delete("/delete/:id", cine.delete);
  router.delete("/delete", cine.deleteAll);

  app.use("/api/cine", router);
};
