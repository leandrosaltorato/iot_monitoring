
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
