const url = process.argv[2] || 'http://localhost:3000/api/medicoes';
const intervalo = Number(process.argv[3] || 5) * 1000;

let temp = 22, umid = 75, lum = 20;
const passo = (v, d, min, max) => Math.min(max, Math.max(min, v + (Math.random() - 0.5) * d));

async function enviar() {
  temp = passo(temp, 2, 15, 32);
  umid = passo(umid, 6, 40, 95);
  lum = passo(lum, 8, 0, 60);
  const corpo = {
    temperatura: +temp.toFixed(1),
    umidade: +umid.toFixed(1),
    luminosidade: +lum.toFixed(1),
  };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    console.log(r.status, JSON.stringify(corpo));
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

enviar();
setInterval(enviar, intervalo);
