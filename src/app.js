const express = require('express');
const qs = require('qs');
const routes = require('./routes');
const { uploadDir } = require('./config/env');

const app = express();

// parseArrays false para o filtro option[45]=GG,PP virar { option: { 45: 'GG,PP' } }
app.set('query parser', (str) => qs.parse(str, { parseArrays: false }));

app.use(express.json({ limit: '10mb' }));
app.use('/media', express.static(uploadDir));
app.use(routes);

// rota não encontrada
app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

// tratamento de erros
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

module.exports = app;
