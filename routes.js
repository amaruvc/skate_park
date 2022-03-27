const express = require("express");
const { sql, Skaters } = require("./models/skater.js");
const bodyParser = require("body-parser");

const router = express.Router();

//Rutas públicas
router.get("/login", (req, res) => {
  res.render("login.html");
});

router.get("/registro", (req, res) => {
  const errors = req.flash("errors");
  res.render("registro.html", { errors });
});

async function nuevoSkater(
  email,
  name,
  password,
  annos_experiencia,
  specialty
) {
  try {
    const t = await sql.transaction();
    const newSkater = await Skaters.create(
      {
        email,
        name,
        password,
        annos_experiencia,
        specialty,
      },
      { transaction: t }
    );
    await t.commit();
  } catch (error) {
    console.error(error);
    await t.rollback();
  }
}
router.post("/registro", async (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const confirm = req.body.confirm;
  const annos_experiencia = req.body.annos;
  const specialty = req.body.specialty;

  const user = await Skaters.findOne({ where: { email } });

  if (password != confirm) {
    req.flash("errors", "La contraseñas no coinciden");
    return res.redirect("/registro");
  }

  if (user) {
    req.flash("errors", "Usuario ya existe o contraseña incorrecta");
    return res.redirect("/register");
  }

  await nuevoSkater(email, name, password, annos_experiencia, specialty);
  res.send("Participante agregado correctamente");
});

router.get("/", (req, res) => {
  res.render("index.html");
});
//Rutas privadas
router.get("/admin", (req, res) => {
  res.render("admin.html");
});

router.get("/Datos", (req, res) => {
  res.render("datos.html");
});
module.exports = router;
