/* ===========================================================================
   Modo demonstração — um "ESP32 de mentirinha" dentro do navegador.
   Aplica as mesmas regras do firmware (calorias, alarme, tampa, meta...) e
   publica as mesmas mensagens MQTT, só que direto para o painel (sem Wokwi e
   sem broker). Serve para testar e apresentar a visualização 3D a qualquer
   momento. Os controles ficam no botão "Modo demonstração" do palco 3D.
   =========================================================================== */
(() => {
  "use strict";
  const App = window.BalancaApp;
  if (!App) return;

  const $ = (id) => document.getElementById(id);
  const KCAL_100G = [130, 165, 155];    // Arroz, Frango, Ovo (mesma tabela do firmware)
  const LIMITE_PESO = 300;              // g
  const LIMITE_TEMP = 30;               // °C
  const INTERVALO_MS = 1500;

  // Estado do "dispositivo"
  const dev = { alimento: 0, meta: 2000, tampa: 0, calDia: 0, ocupado: false, peso: 0, temp: 24.5, umid: 55 };
  let timer = null;
  let ativo = false;
  let pendente = null;

  const pub = (sub, valor, retido) => App.inject(sub, valor, retido);

  // Estado e configurações (o firmware publica isso com retain ao conectar)
  function publicarConfig() {
    pub("status", "online", true);
    pub("config/limite_peso", LIMITE_PESO, true);
    pub("config/limite_temperatura", LIMITE_TEMP, true);
    pub("config/alimento", dev.alimento, true);
    pub("config/meta", dev.meta, true);
    pub("tampa/estado", dev.tampa, true);
  }

  // Um ciclo de leitura: mesma lógica do processarSensoresEEnviar() do firmware
  function ciclo() {
    const peso = dev.peso;
    const calRefeicao = peso * (KCAL_100G[dev.alimento] / 100);

    // só soma ao total do dia quando um NOVO prato é colocado (histerese 10 g / 5 g)
    if (!dev.ocupado && peso > 10) { dev.ocupado = true; dev.calDia += calRefeicao; }
    else if (dev.ocupado && peso < 5) { dev.ocupado = false; }

    let progresso = dev.meta > 0 ? (dev.calDia / dev.meta) * 100 : 0;
    if (progresso > 100) progresso = 100;

    const porcao = peso > LIMITE_PESO;
    const calor = dev.temp > LIMITE_TEMP;
    const motivo = porcao && calor ? "porcao+temperatura" : porcao ? "porcao" : calor ? "temperatura" : "nenhum";

    pub("peso", peso.toFixed(2), false);
    pub("calorias/refeicao", calRefeicao.toFixed(2), false);
    pub("calorias/dia", dev.calDia.toFixed(2), false);
    pub("meta/progresso", progresso.toFixed(2), false);
    pub("ambiente/temperatura", dev.temp.toFixed(2), false);
    pub("ambiente/umidade", dev.umid.toFixed(2), false);
    pub("alarme/status", porcao || calor ? 1 : 0, false);
    pub("alarme/motivo", motivo, false);
  }

  // Comandos vindos do painel (equivalente ao mqttCallback do firmware)
  function comando(sub, valor) {
    const v = Number(valor);
    if (sub === "alimento" && v >= 0 && v <= 2) {
      dev.alimento = v; pub("config/alimento", v, true); ciclo();
    } else if (sub === "meta" && v >= 100 && v <= 10000) {
      dev.meta = v; pub("config/meta", v, true); ciclo();
    } else if (sub === "tampa") {
      dev.tampa = v === 1 ? 1 : 0; pub("tampa/estado", dev.tampa, true);
    } else if (sub === "resetar" && v === 1) {
      dev.calDia = 0; ciclo();
    }
  }

  // ---------- Painel de controles ----------
  const sliders = {
    peso: { el: $("demo-peso"), out: $("demo-peso-out"), unit: " g", dec: 0 },
    temp: { el: $("demo-temp"), out: $("demo-temp-out"), unit: " °C", dec: 1 },
    umid: { el: $("demo-umid"), out: $("demo-umid-out"), unit: " %", dec: 0 },
  };

  function lerSliders() {
    dev.peso = Number(sliders.peso.el.value);
    dev.temp = Number(sliders.temp.el.value);
    dev.umid = Number(sliders.umid.el.value);
    Object.values(sliders).forEach((s) => {
      s.out.textContent = App.fmt(Number(s.el.value), s.dec) + s.unit;
    });
  }

  // Ao mexer nos controles, publica logo (com um pequeno atraso para juntar vários eventos)
  function agendarCiclo() {
    lerSliders();
    if (!ativo || pendente) return;
    pendente = setTimeout(() => { pendente = null; ciclo(); }, 80);
  }

  function definirPeso(g) {
    sliders.peso.el.value = String(g);
    agendarCiclo();
  }

  function iniciar() {
    if (ativo) return;
    ativo = true;
    App.setMode("demo");
    lerSliders();
    dev.calDia = 0; dev.ocupado = false; dev.tampa = 0; dev.alimento = 0; dev.meta = 2000;
    publicarConfig();
    ciclo();
    timer = setInterval(ciclo, INTERVALO_MS);
    $("btn-demo").setAttribute("aria-pressed", "true");
    $("btn-demo").classList.add("on");
    $("demo-panel").hidden = false;
  }

  function parar() {
    if (!ativo) return;
    ativo = false;
    clearInterval(timer); timer = null;
    clearTimeout(pendente); pendente = null;
    App.setMode("mqtt");
    $("btn-demo").setAttribute("aria-pressed", "false");
    $("btn-demo").classList.remove("on");
    $("demo-panel").hidden = true;
  }

  function ligarEventos() {
    $("btn-demo").addEventListener("click", () => (ativo ? parar() : iniciar()));
    Object.values(sliders).forEach((s) => s.el.addEventListener("input", agendarCiclo));
    $("demo-colocar").addEventListener("click", () => definirPeso(250));
    $("demo-retirar").addEventListener("click", () => definirPeso(0));
    $("demo-esquentar").addEventListener("click", () => {
      sliders.temp.el.value = String(sliders.temp.el.value > LIMITE_TEMP ? 24 : 34);
      agendarCiclo();
    });
    $("demo-sair").addEventListener("click", parar);
  }

  ligarEventos();
  lerSliders();
  window.BalancaDemo = { command: comando, start: iniciar, stop: parar, active: () => ativo };
})();
