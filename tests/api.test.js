process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = require('os').tmpdir() + '/uploads-teste';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

const usuario = {
  firstname: 'Ana',
  surname: 'Lima',
  email: 'ana@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
};

let auth;

beforeEach(async () => {
  await sequelize.sync({ force: true });
  await request(app).post('/v1/user').send(usuario);
  const res = await request(app).post('/v1/user/token').send({ email: usuario.email, password: usuario.password });
  auth = { Authorization: `Bearer ${res.body.token}` };
});

afterAll(() => sequelize.close());

describe('usuários', () => {
  test('cadastra usuário e não retorna a senha', async () => {
    const res = await request(app).post('/v1/user').send({ ...usuario, email: 'outro@mail.com' });
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
  });

  test('retorna 400 se as senhas não conferem', async () => {
    const res = await request(app).post('/v1/user').send({ ...usuario, email: 'x@mail.com', confirmPassword: '1' });
    expect(res.status).toBe(400);
  });

  test('busca usuário por id (200 e 404)', async () => {
    expect((await request(app).get('/v1/user/1')).status).toBe(200);
    expect((await request(app).get('/v1/user/99')).status).toBe(404);
  });

  test('atualiza e deleta usuário', async () => {
    const put = await request(app).put('/v1/user/1').set(auth).send({ firstname: 'Maria', surname: 'Souza', email: 'ana@mail.com' });
    expect(put.status).toBe(204);
    expect((await request(app).delete('/v1/user/1').set(auth)).status).toBe(204);
    expect((await request(app).get('/v1/user/1')).status).toBe(404);
  });
});

describe('token', () => {
  test('gera token com login correto', async () => {
    const res = await request(app).post('/v1/user/token').send({ email: usuario.email, password: usuario.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('retorna 400 com senha errada', async () => {
    const res = await request(app).post('/v1/user/token').send({ email: usuario.email, password: 'errada' });
    expect(res.status).toBe(400);
  });

  test('POST sem header Authorization retorna 400 e token inválido retorna 401', async () => {
    const dados = { name: 'Tênis', slug: 'tenis' };
    expect((await request(app).post('/v1/category').send(dados)).status).toBe(400);
    expect((await request(app).post('/v1/category').set({ Authorization: 'Bearer abc' }).send(dados)).status).toBe(401);
  });
});

describe('categorias', () => {
  test('CRUD completo', async () => {
    const criada = await request(app).post('/v1/category').set(auth).send({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    expect(criada.status).toBe(201);

    const id = criada.body.id;
    expect((await request(app).get(`/v1/category/${id}`)).body.name).toBe('Shoes');
    expect((await request(app).put(`/v1/category/${id}`).set(auth).send({ name: 'Tênis', slug: 'tenis' })).status).toBe(204);
    expect((await request(app).delete(`/v1/category/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/v1/category/${id}`)).status).toBe(404);
  });

  test('busca com limit, page e use_in_menu', async () => {
    for (let i = 1; i <= 15; i++) {
      await request(app).post('/v1/category').set(auth).send({ name: `Cat ${i}`, slug: `cat-${i}`, use_in_menu: i <= 5 });
    }
    const padrao = await request(app).get('/v1/category/search');
    expect(padrao.body.data).toHaveLength(12);
    expect(padrao.body.total).toBe(15);

    expect((await request(app).get('/v1/category/search?limit=-1')).body.data).toHaveLength(15);
    expect((await request(app).get('/v1/category/search?use_in_menu=true&limit=-1')).body.total).toBe(5);
    expect((await request(app).get('/v1/category/search?limit=abc')).status).toBe(400);
  });
});

describe('produtos', () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const novoProduto = (extra = {}) => ({
    enabled: true,
    name: 'Produto 01',
    slug: 'produto-01',
    stock: 10,
    description: 'Descrição do produto 01',
    price: 119.9,
    price_with_discount: 99.9,
    ...extra,
  });

  test('cria produto com categoria, imagem e opções', async () => {
    await request(app).post('/v1/category').set(auth).send({ name: 'Shoes', slug: 'shoes' });

    const res = await request(app).post('/v1/product').set(auth).send(novoProduto({
      category_ids: [1],
      images: [{ type: 'image/png', content: png }],
      options: [{ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['PP', 'GG'] }],
    }));

    expect(res.status).toBe(201);
    expect(res.body.category_ids).toEqual([1]);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.options[0].values).toEqual(['PP', 'GG']);
    expect(res.body.options[0].radius).toBe(4);
  });

  test('retorna 400 sem campos obrigatórios', async () => {
    const res = await request(app).post('/v1/product').set(auth).send({ name: 'Sem preço', slug: 'sem-preco' });
    expect(res.status).toBe(400);
  });

  test('busca por id (200 e 404)', async () => {
    await request(app).post('/v1/product').set(auth).send(novoProduto());
    expect((await request(app).get('/v1/product/1')).status).toBe(200);
    expect((await request(app).get('/v1/product/99')).status).toBe(404);
  });

  test('atualiza imagens e opções', async () => {
    await request(app).post('/v1/product').set(auth).send(novoProduto({
      images: [{ type: 'image/png', content: png }, { type: 'image/png', content: png }],
      options: [{ title: 'Cor', values: ['azul'] }, { title: 'Tam', values: ['M'] }],
    }));

    const res = await request(app).put('/v1/product/1').set(auth).send({
      name: 'Produto atualizado',
      images: [{ id: 1, deleted: true }, { type: 'image/png', content: png }],
      options: [{ id: 1, deleted: true }, { id: 2, values: ['G', 'GG'] }],
    });
    expect(res.status).toBe(204);

    const produto = (await request(app).get('/v1/product/1')).body;
    expect(produto.name).toBe('Produto atualizado');
    expect(produto.images).toHaveLength(2);
    expect(produto.options).toHaveLength(1);
    expect(produto.options[0].values).toEqual(['G', 'GG']);
  });

  test('deleta produto', async () => {
    await request(app).post('/v1/product').set(auth).send(novoProduto());
    expect((await request(app).delete('/v1/product/1').set(auth)).status).toBe(204);
    expect((await request(app).get('/v1/product/1')).status).toBe(404);
  });

  test('filtros da busca', async () => {
    await request(app).post('/v1/category').set(auth).send({ name: 'A', slug: 'a' });
    await request(app).post('/v1/product').set(auth).send(novoProduto({
      name: 'Tênis', price: 150, category_ids: [1], options: [{ title: 'Tam', values: ['PP', 'GG'] }],
    }));
    await request(app).post('/v1/product').set(auth).send(novoProduto({ name: 'Camiseta', slug: 'c', price: 50 }));

    const nomes = async (query) => (await request(app).get(`/v1/product/search?${query}`)).body.data.map((p) => p.name);

    expect(await nomes('match=T%C3%AAnis')).toEqual(['Tênis']);
    expect(await nomes('category_ids=1')).toEqual(['Tênis']);
    expect(await nomes('price-range=100-200')).toEqual(['Tênis']);
    expect(await nomes('option[1]=GG')).toEqual(['Tênis']);
    expect(await nomes('option[1]=XL')).toEqual([]);

    const campos = await request(app).get('/v1/product/search?fields=name,price');
    expect(Object.keys(campos.body.data[0])).toEqual(['name', 'price']);
    expect(campos.body.total).toBe(2);
  });
});
