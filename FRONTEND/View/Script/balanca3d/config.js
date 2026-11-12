// ===========================================================================
//  CONFIGURAÇÃO DO PAINEL WEB
//  Troque apenas o PROJECT_ID. Ele precisa ser IGUAL ao PROJECT_ID do
//  firmware (firmware/main.cpp) e ao do app mobile (mobile/config.js).
// ===========================================================================
window.CONFIG = {
  PROJECT_ID: "bn7k2q9",

  // Broker público do HiveMQ, via WebSocket seguro (navegador não fala MQTT "puro").
  // Se a sua rede bloquear a porta 8884, use o EMQX:
  //   BROKER_URL: "wss://broker.emqx.io:8084/mqtt"
  // (e no firmware troque MQTT_SERVER para "broker.emqx.io")
  BROKER_URL: "wss://broker.hivemq.com:8884/mqtt",
};
