// routes/usuarios.routes.js
module.exports = app => {
  const usuarios = require("../controllers/usuarios.controller.js");
  const router = require("express").Router();

  // Crear usuario
  router.post("/create", usuarios.create);

  // Listar todos
  router.get("/", usuarios.findAll);

  // Buscar por correo (antes de :id para evitar colisión)
  router.get("/correo/:correo", usuarios.findByCorreo);

  // Obtener uno por id
  router.get("/:id", usuarios.findOne);

  // Actualizar por id
  router.put("/update/:id", usuarios.update);

  // Eliminar por id
  router.delete("/delete/:id", usuarios.delete);

  // Eliminar todos
  router.delete("/delete", usuarios.deleteAll);

  // Montar en /api/usuarios
  app.use("/api/usuarios", router);
};
