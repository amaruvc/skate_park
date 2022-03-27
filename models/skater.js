const Sequelize = require("sequelize");

const sql = new Sequelize("skatepark", "postgres", "", {
  host: "localhost",
  dialect: "postgres",
});

const Skaters = sql.define("skaters", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  annos_experiencia: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  specialty: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  photo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
});

module.exports = { sql, Skaters };
