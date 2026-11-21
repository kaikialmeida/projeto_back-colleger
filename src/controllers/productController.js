const { Op } = require('sequelize');
const { Product, ProductImage, ProductOption, ProductCategory } = require('../models');
const imageService = require('../services/imageService');

const CAMPOS = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];
const INCLUDE = [
  { model: ProductImage, as: 'images' },
  { model: ProductOption, as: 'options' },
  { model: ProductCategory, as: 'productCategories' },
];

const urlBase = (req) => `${req.protocol}://${req.get('host')}`;

// monta o objeto de resposta do produto
function formatar(p, req) {
  return {
    id: p.id,
    enabled: p.enabled,
    name: p.name,
    slug: p.slug,
    use_in_menu: p.use_in_menu,
    stock: p.stock,
    description: p.description,
    price: p.price,
    price_with_discount: p.price_with_discount,
    category_ids: p.productCategories.map((c) => c.category_id),
    images: p.images.map((i) => ({ id: i.id, content: `${urlBase(req)}/media/${i.path}` })),
    options: p.options.map((o) => ({
      id: o.id,
      title: o.title,
      shape: o.shape,
      radius: o.radius,
      type: o.type,
      values: o.values.split(','),
    })),
  };
}

// transforma o option do payload nos campos da tabela
function dadosOpcao(o) {
  const dados = {};
  if (o.title !== undefined) dados.title = o.title;
  if (o.shape !== undefined) dados.shape = o.shape;
  if (o.type !== undefined) dados.type = o.type;
  if (o.radius !== undefined) dados.radius = parseInt(o.radius, 10) || 0;
  const valores = o.values || o.value;
  if (valores) dados.values = Array.isArray(valores) ? valores.join(',') : valores;
  return dados;
}

const buscarProduto = (id) => Product.findByPk(id, { include: INCLUDE });

exports.search = async (req, res) => {
  const limit = req.query.limit === undefined ? 12 : Number(req.query.limit);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1) || !Number.isInteger(page) || page < 1) {
    return res.status(400).json({ message: 'limit ou page inválido' });
  }

  let fields = null;
  if (req.query.fields) {
    fields = req.query.fields.split(',');
    if (fields.some((f) => !CAMPOS.includes(f))) {
      return res.status(400).json({ message: 'Campo inválido em fields' });
    }
  }

  const where = {};
  let ids = null; // ids de produtos permitidos pelos filtros de categoria e opção

  const filtrarIds = (novos) => {
    ids = ids === null ? novos : ids.filter((id) => novos.includes(id));
  };

  if (req.query.match) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.match}%` } },
      { description: { [Op.like]: `%${req.query.match}%` } },
    ];
  }

  if (req.query['price-range']) {
    const [min, max] = req.query['price-range'].split('-').map(Number);
    if (isNaN(min) || isNaN(max)) return res.status(400).json({ message: 'price-range inválido' });
    where.price = { [Op.between]: [min, max] };
  }

  if (req.query.category_ids) {
    const categorias = req.query.category_ids.split(',').map(Number);
    if (categorias.some(isNaN)) return res.status(400).json({ message: 'category_ids inválido' });
    const links = await ProductCategory.findAll({ where: { category_id: categorias } });
    filtrarIds(links.map((l) => l.product_id));
  }

  if (req.query.option) {
    for (const [optionId, valores] of Object.entries(req.query.option)) {
      if (isNaN(Number(optionId))) return res.status(400).json({ message: 'option inválido' });
      const desejados = String(valores).split(',');
      const opcoes = await ProductOption.findAll({ where: { id: optionId } });
      const achados = opcoes.filter((o) => o.values.split(',').some((v) => desejados.includes(v)));
      filtrarIds(achados.map((o) => o.product_id));
    }
  }

  if (ids !== null) where.id = ids;

  const options = { where, attributes: ['id'], order: [['id', 'ASC']] };
  if (limit !== -1) {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }
  const { rows, count } = await Product.findAndCountAll(options);

  const produtos = await Product.findAll({
    where: { id: rows.map((r) => r.id) },
    include: INCLUDE,
    order: [['id', 'ASC']],
  });

  const data = produtos.map((p) => {
    const item = formatar(p, req);
    if (!fields) return item;
    return Object.fromEntries(fields.map((f) => [f, item[f]]));
  });

  res.status(200).json({ data, total: count, limit, page: limit === -1 ? 1 : page });
};

exports.getById = async (req, res) => {
  const product = await buscarProduto(req.params.id);
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
  res.status(200).json(formatar(product, req));
};

exports.create = async (req, res) => {
  const { category_ids, images, options, ...campos } = req.body;

  if (!campos.name || !campos.slug || campos.price === undefined || campos.price_with_discount === undefined) {
    return res.status(400).json({ message: 'name, slug, price e price_with_discount são obrigatórios' });
  }
  if (isNaN(campos.price) || isNaN(campos.price_with_discount)) {
    return res.status(400).json({ message: 'Preço inválido' });
  }

  const product = await Product.create(campos);

  for (const categoryId of category_ids || []) {
    await ProductCategory.create({ product_id: product.id, category_id: categoryId });
  }
  for (const img of images || []) {
    const path = imageService.salvar(product.id, img);
    await ProductImage.create({ product_id: product.id, enabled: true, path });
  }
  for (const opt of options || []) {
    await ProductOption.create({ ...dadosOpcao(opt), product_id: product.id });
  }

  res.status(201).json(formatar(await buscarProduto(product.id), req));
};

exports.update = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

  const { category_ids, images, options, ...campos } = req.body;
  if (campos.price !== undefined && isNaN(campos.price)) {
    return res.status(400).json({ message: 'Preço inválido' });
  }

  await product.update(campos);

  // categorias: substitui a lista
  if (category_ids) {
    await ProductCategory.destroy({ where: { product_id: product.id } });
    for (const categoryId of category_ids) {
      await ProductCategory.create({ product_id: product.id, category_id: categoryId });
    }
  }

  // imagens: sem id = nova, deleted = remove, content em base64 = troca
  for (const img of images || []) {
    if (!img.id) {
      const path = imageService.salvar(product.id, img);
      await ProductImage.create({ product_id: product.id, enabled: true, path });
      continue;
    }

    const existente = await ProductImage.findOne({ where: { id: img.id, product_id: product.id } });
    if (!existente) continue;

    if (img.deleted) {
      imageService.apagar(existente.path);
      await existente.destroy();
    } else if (img.content && !img.content.startsWith('http')) {
      imageService.apagar(existente.path);
      await existente.update({ path: imageService.salvar(product.id, img) });
    }
  }

  // opções: sem id = nova, deleted = remove, com id = atualiza
  for (const opt of options || []) {
    if (!opt.id) {
      await ProductOption.create({ ...dadosOpcao(opt), product_id: product.id });
    } else if (opt.deleted) {
      await ProductOption.destroy({ where: { id: opt.id, product_id: product.id } });
    } else {
      await ProductOption.update(dadosOpcao(opt), { where: { id: opt.id, product_id: product.id } });
    }
  }

  res.status(204).send();
};

exports.remove = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

  const imagens = await ProductImage.findAll({ where: { product_id: product.id } });
  imagens.forEach((i) => imageService.apagar(i.path));

  await ProductImage.destroy({ where: { product_id: product.id } });
  await ProductOption.destroy({ where: { product_id: product.id } });
  await ProductCategory.destroy({ where: { product_id: product.id } });
  await product.destroy();

  res.status(204).send();
};
