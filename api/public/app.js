
const FAIXAS = {
  temperatura:  { nome: 'Temperatura',  min: 18, max: 26, unidade: '°C', cor: '#b5472f' },
  umidade:      { nome: 'Umidade',      min: 60, max: 90, unidade: '%',  cor: '#2f6f8f' },
  luminosidade: { nome: 'Luminosidade', min: 5,  max: 40, unidade: '%',  cor: '#a07a1c' },
};

const URL_API = 'http://localhost:3000/api/medicoes';
const INTERVALO_ATUALIZACAO = 10000;

const graficos = {};

function criarGrafico(chave) {
  const f = FAIXAS[chave];
  return new Chart(document.getElementById('grafico-' + chave), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: f.nome + ' (' + f.unidade + ')',
        data: [],
        borderColor: f.cor,
        backgroundColor: f.cor,
        borderWidth: 2,
        pointRadius: 1.5,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#2b2a27', boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: (c) => ' ' + c.parsed.y.toFixed(1) + ' ' + f.unidade,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#75716a', maxTicksLimit: 8 }, grid: { color: '#e6e2d8' } },
        y: { ticks: { color: '#75716a' }, grid: { color: '#e6e2d8' } },
      },
    },
  });
}

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function atualizarLeituras(ultima) {
  const lista = document.getElementById('alertas');
  lista.innerHTML = '';
  let temAlerta = false;

  Object.keys(FAIXAS).forEach((chave) => {
    const f = FAIXAS[chave];
    const valor = ultima[chave];
    const fora = valor < f.min || valor > f.max;

    document.getElementById('valor-' + chave).textContent = valor.toFixed(1) + ' ' + f.unidade;
    document.getElementById('faixa-' + chave).textContent = 'ideal: ' + f.min + ' a ' + f.max + ' ' + f.unidade;
    document.getElementById('card-' + chave).classList.toggle('fora', fora);

    if (fora) {
      temAlerta = true;
      const li = document.createElement('li');
      li.textContent = f.nome + ' ' + (valor < f.min ? 'abaixo' : 'acima') +
        ' do ideal: ' + valor.toFixed(1) + ' ' + f.unidade +
        ' (faixa de ' + f.min + ' a ' + f.max + ' ' + f.unidade + ').';
      lista.appendChild(li);
    }
  });

  if (!temAlerta) {
    const li = document.createElement('li');
    li.className = 'normal';
    li.textContent = 'Todos os valores dentro da faixa ideal.';
    lista.appendChild(li);
  }
}

async function carregar() {
  const limite = document.getElementById('limite').value;
  const status = document.getElementById('atualizacao');

  try {
    const resposta = await fetch(URL_API + '?limite=' + limite);
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    const dados = await resposta.json();

    if (!dados.length) {
      status.textContent = 'Nenhuma leitura recebida ainda.';
      return;
    }

    const rotulos = dados.map((d) => formatarHora(d.data));
    Object.keys(graficos).forEach((chave) => {
      graficos[chave].data.labels = rotulos;
      graficos[chave].data.datasets[0].data = dados.map((d) => d[chave]);
      graficos[chave].update();
    });

    const ultima = dados[dados.length - 1];
    atualizarLeituras(ultima);
    status.textContent = 'Última leitura em ' + new Date(ultima.data).toLocaleString('pt-BR');
  } catch (erro) {
    status.textContent = 'Não foi possível buscar os dados da API.';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  Object.keys(FAIXAS).forEach((chave) => {
    graficos[chave] = criarGrafico(chave);
  });
  document.getElementById('limite').addEventListener('change', carregar);
  carregar();
  setInterval(carregar, INTERVALO_ATUALIZACAO);
});
