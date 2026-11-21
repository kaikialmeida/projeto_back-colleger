const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

// Valida o header "Authorization: Bearer <jwt>" nas rotas POST, PUT e DELETE
module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(400).json({ message: 'Token não informado' });
  }

  try {
    req.user = jwt.verify(header.split(' ')[1], jwtSecret);
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
