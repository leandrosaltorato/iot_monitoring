# Monitoramento IoT — Temperatura, Umidade e Luminosidade

Sistema de monitoramento ambiental com IoT. Um **ESP32** mede **temperatura**, **umidade** (sensor DHT11) e **luminosidade** (LDR) e envia as leituras por Wi-Fi para uma API. O site exibe os dados em gráficos e emite alertas quando algum valor sai da faixa ideal.

## Descrição da experiência


- **Objetivo:** monitorar as condições de um ambiente e avisar quando saem do ideal.
- **Dispositivo:** ESP32 com sensor DHT11 (temperatura e umidade) e LDR (luminosidade).
- **Envio dos dados:** a cada 60 segundos o ESP32 faz um `POST` em JSON para a API.
- **Armazenamento:** a API grava cada leitura no banco MySQL via Prisma.
- **Visualização:** página web com três gráficos de linha e painel de alertas, atualizada a cada 10 segundos.

### Ligações do circuito

| Componente | Pino do ESP32 |
|------------|---------------|
| DHT11 (dados) | GPIO 18 |
| LDR (leitura analógica) | GPIO 34 |

### Faixas ideais

| Grandeza     | Mínimo | Máximo |
|--------------|--------|--------|
| Temperatura  | 18 °C  | 26 °C  |
| Umidade      | 60 %   | 90 %   |
| Luminosidade | 5 %    | 40 %   |

Fora dessas faixas, o cartão da grandeza fica destacado e uma mensagem aparece na lista de alertas

#

## Tecnologias

- **Dispositivo:** ESP32 (Arduino IDE), biblioteca DHT, Wi-Fi e HTTPClient
- **Front-end:** HTML, CSS, JavaScript e [Chart.js](https://www.chartjs.org/)
- **Back-end:** Node.js, Express
- **Banco de dados:** MySQL com Prisma ORM

## Estrutura do projeto

```
monitoramento_iot/
└── api/
    ├── public/        # front-end
    ├── src/data/     
    ├── prisma/       
    ├── app.js        
    ├── server.js      
    └── .env           
```

## Como executar a API

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- MySQL em execução

### Passo a passo

1. Entre na pasta da API:
   ```bash
   cd api
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo `.env` na pasta `api` com a conexão do banco e a porta:
   ```env
   DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/NOME_DO_BANCO"
   PORT=3000
   ```
4. Gere o cliente do Prisma e crie as tabelas:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Inicie o servidor:
   ```bash
   node server.js
   ```
6. Abra no navegador: **http://localhost:3000**

O servidor escuta em `0.0.0.0`, então o ESP32 consegue acessá-lo pelo IP do computador na rede local. Se o ESP32 não conseguir enviar, libere a porta 3000 no firewall do Windows.

## Código do ESP32

Antes de gravar na placa, ajuste o Wi-Fi e o `API_URL` com o **IP do computador onde a API está rodando** (descubra com `ipconfig`). Instale na Arduino IDE a biblioteca **DHT sensor library** 

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

const char* WIFI_SSID = "TI_SENAI2";
const char* WIFI_PASS = "senai2025";
const char* API_URL   = "http://192.168.1.112:3000/api/medicoes";

#define DHTPIN  18
#define DHTTYPE DHT11
const int LDR_PIN = 34;

const unsigned long INTERVALO_MS = 60000;

DHT dht(DHTPIN, DHTTYPE);
unsigned long ultimoEnvio = 0;
bool primeiroEnvio = true;

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Conectando ao Wi-Fi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 40) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nConectado. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar. Tentando de novo no próximo ciclo.");
  }
}

float lerLuminosidade() {
  int bruto = analogRead(LDR_PIN);
  return bruto * 100.0 / 4095.0;
}

void enviarMedicao() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  float l = lerLuminosidade();

  if (isnan(t) || isnan(h)) {
    Serial.println("Sem receber dados do sensor DHT11");
    return;
  }

  conectarWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  char corpo[128];
  snprintf(corpo, sizeof(corpo),
           "{\"temperatura\":%.1f,\"umidade\":%.1f,\"luminosidade\":%.1f}", t, h, l);
  Serial.print("Enviando: ");
  Serial.println(corpo);

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  int codigo = http.POST(corpo);
  if (codigo > 0) {
    Serial.printf("Resposta da API: %d\n", codigo);
  } else {
    Serial.printf("Erro no POST: %s\n", http.errorToString(codigo).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(LDR_PIN, INPUT);
  dht.begin();
  conectarWiFi();
}

void loop() {
  unsigned long agora = millis();
  if (primeiroEnvio || agora - ultimoEnvio >= INTERVALO_MS) {
    if (primeiroEnvio) delay(1500);
    primeiroEnvio = false;
    ultimoEnvio = agora;
    enviarMedicao();
  }
  delay(100);
}
```

### Como funciona

- A luminosidade é lida no pino analógico (0 a 4095) e convertida para porcentagem (0 a 100).
- Se o DHT11 não responder, a leitura daquele ciclo é descartada.
- Se o Wi-Fi cair, o ESP32 tenta reconectar no próximo envio.
- O monitor serial (115200) mostra o JSON enviado e o código de resposta da API (`201` = salvo).

## Endpoints

### `GET /api/medicoes?limite=60`

Retorna as últimas leituras em ordem crescente de data (limite entre 1 e 1000).

```json
[
  { "data": "2026-11-11T17:30:00.000Z", "temperatura": 22.5, "umidade": 70.2, "luminosidade": 20.1 }
]
```

### `POST /api/medicoes`

Recebe uma leitura do dispositivo.

```json
{ "temperatura": 22.5, "umidade": 70, "luminosidade": 20 }
```

Resposta `201` com a leitura salva, ou `400` se algum campo não for número.

## Resultados

### Site com os gráficos

![Site com gráficos](docs/site-graficos.png)
![Site com gráficos](docs/site-graficos2.png)

## Como subir no GitHub

Crie um `.gitignore` com:

```
node_modules/
.env
```

Depois:

```bash
git init
git add .
git commit -m "Projeto de monitoramento IoT"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

