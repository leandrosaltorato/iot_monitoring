const prisma = require('../lib/prisma');

async function criar(req, res) {
  const { temperatura, umidade, luminosidade } = req.body || {};

  if ([temperatura, umidade, luminosidade].some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return res.status(400).json({
      erro: 'Corpo inválido. Envie temperatura, umidade e luminosidade como números.',
    });
  }

  try {
    const medicao = await prisma.medicao.create({
      data: { temperatura, umidade, luminosidade },
    });
    res.status(201).json(medicao);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao gravar no banco.' });
  }
}

// GET /api/medicoes?limite=100 -> últimas N medições, em ordem cronológica
async function listar(req, res) {
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 100, 1), 1000);

  try {
    const medicoes = await prisma.medicao.findMany({
      orderBy: { id: 'desc' },
      take: limite,
    });
    res.json(medicoes.reverse());
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao consultar o banco.' });
  }
}

// GET /api/medicoes/ultima -> medição mais recente
async function ultima(_req, res) {
  try {
    const medicao = await prisma.medicao.findFirst({ orderBy: { id: 'desc' } });
    if (!medicao) return res.status(404).json({ erro: 'Nenhuma medição ainda.' });
    res.json(medicao);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao consultar o banco.' });
  }
}

module.exports = { criar, listar, ultima };
