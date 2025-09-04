// Importamos el modulo express 
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));


app.use(bodyParser.json());


app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models/index.js");

//db.sequelize.sync({ force: true }); //para eliminar todas la tablas y crear tablas nuevas en la base de datos
 
db.sequelize.sync();//crea las tablas si no existen (no elimina tablas existentes)


app.get("/", (req, res) => {
  res.json({ message: "UMG Web Application" });
});

require("./app/routes/cine.routes.js")(app);
// ... arriba stays igual
require("./app/routes/usuarios.routes.js")(app);
require("./app/routes/clientes.routes.js")(app);
require("./app/routes/empleados.routes.js")(app);
require("./app/routes/proveedores.routes.js")(app);
require("./app/routes/productos.routes.js")(app);
require("./app/routes/inventario.routes.js")(app);
require("./app/routes/movimientos_inventario.routes.js")(app);
require("./app/routes/pedidos.routes.js")(app);
require("./app/routes/detalle_pedido.routes.js")(app);
require("./app/routes/pagos.routes.js")(app);



const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});