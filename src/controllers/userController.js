const bcrypt = require('bcrypt');
const { User } = require('../models');
const { gerarToken } = require('../services/authService');

const dados = (u) => ({ id: u.id, firstname: u.firstname, surname: u.surname, email: u.email });

exports.getById = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  res.status(200).json(dados(user));
};

exports.create = async (req, res) => {
  const { firstname, surname, email, password, confirmPassword } = req.body;

  if (!firstname || !surname || !email || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'As senhas não conferem' });
  }
  if (await User.findOne({ where: { email } })) {
    return res.status(400).json({ message: 'E-mail já cadastrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ firstname, surname, email, password: hash });
  res.status(201).json(dados(user));
};

exports.update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  const { firstname, surname, email } = req.body;
  if (!firstname || !surname || !email) {
    return res.status(400).json({ message: 'Preencha todos os campos' });
  }

  const outro = await User.findOne({ where: { email } });
  if (outro && outro.id !== user.id) {
    return res.status(400).json({ message: 'E-mail já cadastrado' });
  }

  await user.update({ firstname, surname, email });
  res.status(204).send();
};

exports.remove = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  await user.destroy();
  res.status(204).send();
};

exports.token = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Informe email e password' });

  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Email ou senha incorretos' });
  }

  res.status(200).json({ token: gerarToken(user) });
};
