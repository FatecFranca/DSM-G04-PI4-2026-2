# Balança Nutricional IoT — painel web com gêmeo digital 3D

Esta pasta é a solução web **completa** (substitui a pasta `web/` da versão 2).

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página: palco 3D no topo e o painel detalhado (gauges, gráficos, monitor MQTT) abaixo |
| `style.css` | Visual (tema claro/escuro automático, celular) |
| `config.js` | **`PROJECT_ID`** e endereço do broker (o mesmo do firmware e do app mobile) |
| `app.js` | Núcleo: MQTT, estado, painéis 2D e comandos |
| `demo.js` | **Modo demonstração**: um ESP32 simulado dentro do navegador |
| `twin3d.js` | A cena 3D (Three.js r128) |

## Como testar (2 minutos, sem Wokwi)

1. Dê dois cliques em `index.html` (precisa de internet: o Three.js, o MQTT.js e as fontes vêm de CDN).
2. No canto superior direito do palco, clique em **Modo demonstração**.
3. Embaixo, escolha **Frango**.
4. Arraste **Peso no prato**: o prato de frango sai da bancada, voa até a balança e o visor mostra o peso; o rótulo mostra gramas, calorias e % da meta. A quantidade de coxinhas acompanha o peso.
5. Passe de 300 g: buzzer e LED disparam, saem ondas de som e aparece o alarme. Suba a temperatura acima de 30 °C: o alarme dispara por outro motivo.
6. Clique na **tampa** (na cena ou na etiqueta): o servo gira e a tampa abre. Tente **Arroz** e **Ovo**.

## Com o dispositivo real (Wokwi)

Deixe o `PROJECT_ID` de `config.js` igual ao do firmware e inicie a simulação. Quando as bolinhas do topo ficarem verdes, a cena passa a mostrar os dados reais. Enquanto não houver dados (ou se o dispositivo cair), a cena fica esmaecida e um aviso explica o motivo.

## O que cada objeto mostra

| Objeto 3D | Dado |
|---|---|
| Prato (arroz, frango ou ovo) | Alimento escolhido e peso: ele vai para a balança quando há peso (> 10 g) e volta quando tira (< 5 g) |
| Visor da balança | Peso (HX711) |
| LED, buzzer e ondas vermelhas | Alarme automático (porção ou temperatura) |
| Recipiente com tampa e servo | Tampa manual (comando do app) |
| Estação com termômetro | Temperatura e umidade (DHT22) |
| Pote de vidro | Calorias do dia em relação à meta |

## Controles da cena

Arrastar gira · roda do mouse ou pinça aproxima · duplo clique volta à visão geral · botões **Visão geral / Balança / Tampa / Meta / Ambiente** movem a câmera · ⛶ tela cheia · setas e `+`/`-` funcionam com o palco em foco.

## Se algo não aparecer

- **"Não foi possível carregar o Three.js"**: sem internet ou CDN bloqueada pela rede. O painel 2D continua funcionando.
- **"Não foi possível iniciar o 3D: …"**: abra o console (F12) e me mande a mensagem.
- **Comando enviado e nada acontece**: o dispositivo precisa estar online (no modo demonstração sempre está).
- O "Total do dia" soma as calorias no momento em que o prato é colocado (regra do firmware); escolha o alimento **antes** de pôr peso.
