const { randomUUID, createHmac } = require('crypto');

// ====== EDITE AQUI: seus produtos ======
// id: sem espaços | price: em reais | link: onde o comprador baixa a build (só aparece após o Pix ser aprovado)
const PRODUCTS = [
  { id: 'castelo', cat: 'Estruturas', name: 'Castelo Medieval', price: 19.9, desc: 'Build completa, pronta para o Studio.', link: 'https://COLE-O-LINK-DA-BUILD-AQUI' },
  { id: 'spawn', cat: 'Mapas', name: 'Spawn Moderno', price: 9.9, desc: 'Área inicial com decoração.', link: 'https://COLE-O-LINK-DA-BUILD-AQUI' },
];
// =======================================

const MP = 'https://api.mercadopago.com/v1/payments';
const auth = () => ({ Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN, 'Content-Type': 'application/json' });
const sign = (id) => createHmac('sha256', process.env.MP_ACCESS_TOKEN || 'x').update(String(id)).digest('hex');
const json = (c, b) => ({ statusCode: c, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(b) });

exports.handler = async (e) => {
  if (e.httpMethod === 'OPTIONS') return json(204, {});
  const route = e.path.split('/').pop();
  try {
    if (route === 'products') return json(200, PRODUCTS.map(({ link, ...p }) => p));

    if (route === 'create-pix' && e.httpMethod === 'POST') {
      const { productId, email } = JSON.parse(e.body || '{}');
      const p = PRODUCTS.find((x) => x.id === productId);
      if (!p || !/^\S+@\S+\.\S+$/.test(email || '')) return json(400, { error: 'Dados inválidos' });
      const r = await fetch(MP, {
        method: 'POST',
        headers: { ...auth(), 'X-Idempotency-Key': randomUUID() },
        body: JSON.stringify({
          transaction_amount: p.price,
          description: 'Build Store - ' + p.name,
          payment_method_id: 'pix',
          payer: { email },
          external_reference: p.id,
        }),
      });
      const d = await r.json();
      if (!r.ok) return json(502, { error: 'Não foi possível gerar o Pix' });
      const t = d.point_of_interaction.transaction_data;
      return json(200, { id: d.id, token: sign(d.id), code: t.qr_code, qr: t.qr_code_base64 });
    }

    if (route === 'status') {
      const q = e.queryStringParameters || {};
      if (!/^\d+$/.test(q.id || '') || q.token !== sign(q.id)) return json(400, { error: 'Pedido inválido' });
      const d = await (await fetch(MP + '/' + q.id, { headers: auth() })).json();
      const p = PRODUCTS.find((x) => x.id === d.external_reference);
      if (d.status === 'approved' && p) return json(200, { status: 'approved', name: p.name, link: p.link });
      return json(200, { status: d.status });
    }

    return json(404, { error: 'Não encontrado' });
  } catch (err) {
    return json(500, { error: 'Erro interno' });
  }
};
