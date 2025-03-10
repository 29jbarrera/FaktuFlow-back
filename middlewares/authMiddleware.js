const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado' });
  }

  try {
    const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = verified; // Guardamos los datos del usuario en `req.user`
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar si el usuario es administrador
const verifyAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso solo para administradores' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
