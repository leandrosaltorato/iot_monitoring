require('dotenv').config();
const app = require('./app');
const prisma = require('./src/data/prisma');

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, '0.0.0.0', () =>
  console.log(`API rodando em http://localhost:${PORT}`)
);

async function encerrar() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
