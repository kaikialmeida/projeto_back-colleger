const { Category, ProductCategory } = require('../models');

const CAMPOS = ['id', 'name', 'slug', 'use_in_menu'];

exports.search = async (req, res) => {
  const limit = req.query.limit === undefined ? 12 : Number(req.query.limit);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1) || !Number.isInteger(page) || page < 1) {
    return res.status(400).json({ message: 'limit ou page inválido' });
  }

  const where = {};
  if (req.query.use_in_menu === 'true') where.use_in_menu = true;

  let attributes = CAMPOS;
  if (req.query.fields) {
    attributes = req.query.fields.split(',');
    if (attributes.some((f) => !CAMPOS.includes(f))) {
      return res.status(400).json({ message: 'Campo inválido em fields' });
    }
  }

  const options = { where, attributes, order: [['id', 'ASC']] };
  if (limit !== -1) {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }

  const { rows, count } = await Category.findAndCountAll(options);
  res.status(200).json({ data: rows, total: count, limit, page: limit === -1 ? 1 : page });
};

exports.getById = async (req, res) => {
  const category = await Category.findByPk(req.params.id, { attributes: CAMPOS });
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
  res.status(200).json(category);
};

exports.create = async (req, res) => {
  const { name, slug, use_in_menu } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'name e slug são obrigatórios' });

  const category = await Category.create({ name, slug, use_in_menu });
  res.status(201).json({
    id: category.id,
    name: category.name,
    slug: category.slug,
    use_in_menu: category.use_in_menu,
  });
};

exports.update = async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });

  const { name, slug, use_in_menu } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'name e slug são obrigatórios' });

  await category.update({ name, slug, use_in_menu });
  res.status(204).send();
};

exports.remove = async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });

  await ProductCategory.destroy({ where: { category_id: category.id } });
  await category.destroy();
  res.status(204).send();
};
