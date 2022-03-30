const express = require("express");
const { sql, Skaters } = require("./models/skater.js");
const bcrypt = require("bcrypt");
const uuid = require("uuid");

const router = express.Router();

//Rutas públicas
router.get("/login", (req, res) => {
  const errors = req.flash("errors");
  res.render("login.html", { errors });
});

router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const usuario = await Skaters.findOne({ where: { email } });

  const match = await bcrypt.compare(password, usuario?.password);
  if (!usuario || !match) {
    req.flash("errors", ["Usuario o contraseña incorrectos"]);
    return res.redirect("/login");
  }
  req.session.user = usuario;
  res.redirect("/");
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
  specialty,
  photo
) {
  try {
    const t = await sql.transaction();
    await Skaters.create(
      {
        email,
        name,
        password,
        annos_experiencia,
        specialty,
        photo,
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
  try {
    const email = req.body.email;
    const name = req.body.name;
    let password = req.body.password;
    const confirm = req.body.confirm;
    const annos_experiencia = req.body.annos;
    const specialty = req.body.specialty;
    const photo = req.files.photo;

    const extension = photo.name.split(".").slice(-1).pop().toLowerCase();

    if (
      extension != "jpg" &&
      extension != "png" &&
      extension != "jpeg" &&
      extension != "bpm"
    ) {
      req.flash("errors", ["El formato de la imagen es incorrecto"]);
      return res.redirect("/registro");
    }
    const photoName = `${uuid.v4()}.${extension}`;

    await photo.mv(`static/img_usuarios/${photoName}`);
    const user = await Skaters.findOne({ where: { email } });

    if (user) {
      req.flash("errors", ["Usuario ya existe o contraseña incorrecta"]);
      return res.redirect("/registro");
    }

    if (password != confirm) {
      req.flash("errors", ["La contraseñas no coinciden"]);
      return res.redirect("/registro");
    }

    password = await bcrypt.hash(password, 10);
    await nuevoSkater(
      email,
      name,
      password,
      annos_experiencia,
      specialty,
      photoName
    );

    req.session.user = { name, email };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
});

router.get("/logout", (req, res) => {
  req.session.user = undefined;
  res.redirect("/login");
});

router.get("/", async (req, res) => {
  const skaters = await Skaters.findAll();
  const user = req.session.user;
  console.log(user);
  res.render("index.html", { skaters, user });
});

function protected_routes(req, res, next) {
  if (!req.session.user) {
    req.flash("errors", ["Debe ingresar al sistema primero"]);
    return res.redirect("/login");
  }
  next();
}

//Rutas privadas
router.get("/admin", protected_routes, async (req, res) => {
  const user = req.session.user;
  // me traigo a lista de todos los usuarios
  const users = await Skaters.findAll();

  res.render("admin.html", { user, users });
});

router.get("/Datos", protected_routes, (req, res) => {
  const user = req.session.user;
  const errors = req.flash("errors");

  res.render("datos.html", { user, errors });
});
module.exports = router;
