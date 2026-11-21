const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');
const { nodeEnv } = require('../config/env');

const config = dbConfig[nodeEnv] || dbConfig.development;
const { database, username, password, ...options } = config;

const sequelize =
  config.dialect === 'sqlite'
    ? new Sequelize(options)
    : new Sequelize(database, username, password, options);

const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const ProductImage = require('./ProductImage')(sequelize, DataTypes);
const ProductOption = require('./ProductOption')(sequelize, DataTypes);
const ProductCategory = require('./ProductCategory')(sequelize, DataTypes);

// Product 1:N ProductImage / ProductOption
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE', hooks: true });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE', hooks: true });
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product N:N Category (tabela product_categories)
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'categories',
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'products',
});
Product.hasMany(ProductCategory, { foreignKey: 'product_id', as: 'productCategories' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
};
