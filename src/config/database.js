require('dotenv').config();

const mysql = {
  dialect: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'projeto_backend',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
};

// Formato compatível com o sequelize-cli (migrations) e com src/models/index.js
module.exports = {
  development: { ...mysql },
  production: { ...mysql },
  // Testes usam SQLite em memória (rápido, sem depender de um servidor MySQL)
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: { timestamps: true, underscored: true },
  },
};
