  module.exports = app => {
    const express = require("express");
    const router = express.Router();
    const authCtrl = require("../controllers/auth.controller.js");

    router.post("/login", authCtrl.login);

    app.use("/api/auth", router);
  };