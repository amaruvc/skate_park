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

  const match = await bcrypt.compare(password, usuario?.password ?? "");
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
  const message = req.flash("message");
  res.render("index.html", { skaters, user, message });
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
  const skaters = await Skaters.findAll();

  res.render("admin.html", { user, skaters });
});

router.post("/admin", protected_routes, async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;

  const skater = await Skaters.findByPk(id);
  skater.status = status;
  await skater.save();
  res.json({ ok: true });
});

router.get("/datos", protected_routes, async (req, res) => {
  const user = await Skaters.findOne({
    where: { email: req.session.user.email },
  });
  const errors = req.flash("errors");

  res.render("datos.html", { user, errors });
});

router.post("/datos", protected_routes, async (req, res) => {
  const user = await Skaters.findOne({
    where: { email: req.session.user.email },
  });

  if (req.body.btn_eliminar === "") {
    await user.destroy();
    req.session.user = undefined;
    req.flash("message", ["Cuenta eliminada correctamente"]);
    return res.redirect("/");
  } else {
    user.name = req.body.name;
    user.annos_experiencia = req.body.annos;
    user.specialty = req.body.specialty;

    const password = req.body.password;
    const confirm = req.body.confirm;
    if (password) {
      if (password != confirm) {
        req.flash("errors", ["La contraseñas no coinciden"]);
        return res.redirect("/datos");
      }

      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    req.flash("message", ["Datos actualizados correctamente"]);
    return res.redirect("/");
  }
});

module.exports = router;
