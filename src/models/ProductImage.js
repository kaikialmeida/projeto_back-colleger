module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'ProductImage',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      // Caminho relativo da imagem salva no servidor
      path: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'product_images',
      timestamps: false,
      underscored: true,
    }
  );
