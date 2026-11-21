const app = require('./app');
const { sequelize } = require('./models');
const { port } = require('./config/env');

sequelize
  .authenticate()
  .then(() => {
    console.log('Conectado ao banco de dados');
    app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar no banco:', err.message);
    process.exit(1);
  });
