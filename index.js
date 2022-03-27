const express = require("express");
const { sql } = require("./models/skater.js");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const fileupload = require("express-fileupload");
const session = require("express-session");
const flash = require("connect-flash");

const app = express();

app.use(bodyParser.json());
//Para sincronizar la bd
async function syncBD() {
  await sql.sync({ force: true });
}
// syncBD();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

nunjucks.configure("templates", {
  express: app,
  autoscape: true,
  noCache: false,
  watch: true,
});

app.use(
  session({
    secret: "mi-clave",
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 * 24 }, // 1 día
    resave: false,
  })
);

app.use(
  fileupload({
    limits: { fileSize: 5242880 },
    abortOnLimit: true,
    responseOnLimit: "El peso del archivo supera el máximo (5Mb)",
  })
);

// 3. Importa las rutas
app.use(require("./routes.js"));

app.listen(3000, () => {
  console.log("Server iniciado en el puerto 3000");
});
