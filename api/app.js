const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./src/data/prisma');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/medicoes', async (req, res) => {
    try {
        const limite = Math.min(Math.max(parseInt(req.query.limite) || 60, 1), 1000);
        const dados = await prisma.medicao.findMany({
            orderBy: { data: 'desc' },
            take: limite,
        });
        res.json(dados.reverse());
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar medições' });
    }
});

app.post('/api/medicoes', async (req, res) => {
    try {
        const { temperatura, umidade, luminosidade } = req.body;
        if ([temperatura, umidade, luminosidade].some((v) => typeof v !== 'number')) {
            return res.status(400).json({ erro: 'Envie temperatura, umidade e luminosidade como números' });
        }
        const nova = await prisma.medicao.create({
            data: { temperatura, umidade, luminosidade },
        });
        res.status(201).json(nova);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar medição' });
    }
});

module.exports = app;