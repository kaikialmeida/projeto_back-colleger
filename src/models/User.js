module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      // Hash gerado com bcrypt (nunca a senha em texto puro)
      password: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
    }
  );
