const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadDir } = require('../config/env');

// salva uma imagem em base64 na pasta de uploads e devolve o caminho relativo
exports.salvar = (productId, { type, content }) => {
  const ext = String(type || 'image/png').split('/')[1] === 'jpeg' ? 'jpg' : String(type || 'image/png').split('/')[1];
  const pasta = path.join(uploadDir, `product-${productId}`);
  fs.mkdirSync(pasta, { recursive: true });

  const nome = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const base64 = content.replace(/^data:.*;base64,/, '');
  fs.writeFileSync(path.join(pasta, nome), Buffer.from(base64, 'base64'));

  return `product-${productId}/${nome}`;
};

exports.apagar = (relativePath) => {
  fs.rmSync(path.join(uploadDir, relativePath), { force: true });
};
