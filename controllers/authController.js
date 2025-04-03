const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const register = async (req, res) => {
  const { nombre, apellidos, email, password, rol } = req.body;

  try {
    const userExists = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, apellidos, email, password, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, apellidos, email, rol",
      [nombre, apellidos, email, hashedPassword, rol || "autonomo"]
    );

    res
      .status(201)
      .json({ message: "Usuario registrado con éxito", user: newUser.rows[0] });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        nombre: user.rows[0].nombre,
        apellidos: user.rows[0].apellidos,
        rol: user.rows[0].rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario_id: user.rows[0].id,
      email: user.rows[0].email,
      rol: user.rows[0].rol,
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { register, login };
