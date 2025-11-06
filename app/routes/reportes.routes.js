// routes/reportes.routes.js
module.exports = (app) => {
  const reportes = require("../controllers/reportes.controller.js");
  const router = require("express").Router();

  router.get("/ventas", reportes.ventas);
  // NUEVOS rankings
  router.get("/top-productos", reportes.topProductos);
  router.get("/top-usuarios",  reportes.topUsuarios);
  router.get("/t-usuarios", reportes.topUsuarios); 

  app.use("/api/reportes", router);
};
