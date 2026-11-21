# Projeto Back End

API REST de uma loja (usuários, categorias e produtos) feita com Node.js, Express, Sequelize, MySQL e JWT.

## Como rodar

```bash
npm install
cp .env.example .env     # ajuste a senha do banco (DB_PASS) e o JWT_SECRET
```

Crie o banco e rode as migrations:

```bash
mysql -uroot -p -e "CREATE DATABASE projeto_backend"
npm run migrate
```

Inicie a API:

```bash
npm run dev      # com nodemon
npm start
```

Testes (usam SQLite em memória):

```bash
npm test
```

## Estrutura

```
src/
  config/        configurações (.env e banco)
  controllers/   lógica das rotas
  database/migrations/
  middleware/    validação do token JWT
  models/        tabelas do Sequelize
  routes/        rotas da API
  services/      token JWT e upload de imagens
  app.js
  server.js
tests/
```

## Endpoints

POST, PUT e DELETE precisam do header `Authorization: Bearer <token>`
(menos `POST /v1/user` e `POST /v1/user/token`).
Sem o header retorna 400; token inválido retorna 401.

### Usuário
| Método | Rota | Status |
|---|---|---|
| POST | /v1/user/token | 200, 400 |
| POST | /v1/user | 201, 400 |
| GET | /v1/user/:id | 200, 404 |
| PUT | /v1/user/:id | 204, 400, 401, 404 |
| DELETE | /v1/user/:id | 204, 401, 404 |

### Categoria
| Método | Rota | Status |
|---|---|---|
| GET | /v1/category/search | 200, 400 |
| GET | /v1/category/:id | 200, 404 |
| POST | /v1/category | 201, 400, 401 |
| PUT | /v1/category/:id | 204, 400, 401, 404 |
| DELETE | /v1/category/:id | 204, 401, 404 |

Parâmetros da busca: `limit` (padrão 12, `-1` para todos), `page`, `fields` e `use_in_menu=true`.

### Produto
| Método | Rota | Status |
|---|---|---|
| GET | /v1/product/search | 200, 400 |
| GET | /v1/product/:id | 200, 404 |
| POST | /v1/product | 201, 400, 401 |
| PUT | /v1/product/:id | 204, 400, 401, 404 |
| DELETE | /v1/product/:id | 204, 401, 404 |

Parâmetros da busca: `limit`, `page`, `fields`, `match` (nome ou descrição), `category_ids=1,2`, `price-range=100-200` e `option[id]=GG,PP`.

Exemplo de corpo do POST /v1/product:

```json
{
  "enabled": true,
  "name": "Produto 01",
  "slug": "produto-01",
  "stock": 10,
  "description": "Descrição",
  "price": 119.9,
  "price_with_discount": 99.9,
  "category_ids": [1],
  "images": [{ "type": "image/png", "content": "<base64>" }],
  "options": [{ "title": "Tamanho", "shape": "square", "type": "text", "values": ["PP", "GG"] }]
}
```

No PUT, imagens e opções sem `id` são criadas, `{ "id": 1, "deleted": true }` remove e, com `id` e novos campos, atualiza.
As imagens são salvas na pasta `uploads/` e servidas em `/media`.
