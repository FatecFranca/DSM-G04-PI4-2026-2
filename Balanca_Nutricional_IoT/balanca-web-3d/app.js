/* ===========================================================================
   Balança Nutricional IoT — painel web (JavaScript puro)
   Conecta ao broker MQTT via WebSocket, assina balanca-nutricional/<ID>/#
   e desenha os dados. Os botões publicam em balanca-nutricional/<ID>/cmd/...

   Este arquivo é o "núcleo": estado, MQTT, painéis 2D e comandos. A cena 3D
   (twin3d.js) e o modo demonstração (demo.js) conversam com ele pela API
   pública window.BalancaApp, definida no final do arquivo.
   =========================================================================== */
(() => {
  "use strict";

  // ---------- Configuração ----------
  const CFG = window.CONFIG || {};
  const PROJECT_ID = String(CFG.PROJECT_ID || "").trim();
  const BASE = `balanca-nutricional/${PROJECT_ID}`;

  const FOODS = ["Arroz", "Frango", "Ovo"];
  const PESO_MAX = 1000;               // fundo de escala do medidor de peso (g)
  const TEMP_MIN = 0, TEMP_MAX = 50;   // escala do medidor de temperatura (°C)
  const STALE_MS = 12000;              // sem telemetria há mais que isso = "sem dados recentes"
  const MAX_HIST = 60;                 // pontos guardados nos gráficos
  const MAX_LOG = 40;                  // linhas do monitor MQTT

  // ---------- Estado ----------
  const S = {
    broker: "conectando",
    device: "desconhecido",
    peso: null, calRef: null, calDia: null, progresso: null,
    temp: null, umid: null,
    alarme: null, motivo: null,
    tampa: null, alimento: null, meta: null,
    limPeso: null, limTemp: null,
    lastData: null,                    // Date.now() da última telemetria AO VIVO
    mode: "mqtt",                      // "mqtt" = dispositivo real | "demo" = simulador no navegador
  };
  const hist = { peso: [], temp: [] };
  let client = null;

  // ---------- Utilidades ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (raw) => {
    const v = Number(String(raw).trim().replace(",", "."));
    return Number.isFinite(v) && String(raw).trim() !== "" ? v : null;
  };
  const fmt = (v, d = 0) =>
    v === null || v === undefined
      ? "--"
      : v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const hhmmss = () => new Date().toLocaleTimeString("pt-BR", { hour12: false });
  const rel = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 3) return "agora";
    if (s < 60) return `há ${s} s`;
    if (s < 3600) return `há ${Math.floor(s / 60)} min`;
    return `há ${Math.floor(s / 3600)} h`;
  };

  let toastTimer = null;
  function toast(msg, kind) {
    const el = $("toast");
    el.textContent = msg;
    el.dataset.kind = kind || "";
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // ---------- Medidores (arcos SVG) ----------
  function setArc(el, fraction) {
    el.style.strokeDasharray = `${(clamp(fraction, 0, 1) * 100).toFixed(2)} 100`;
  }
  // Marca um limite no arco (fração 0..1 da escala) ou esconde a marca (null)
  function placeMarker(line, fraction) {
    if (fraction === null) { line.setAttribute("visibility", "hidden"); return; }
    const a = Math.PI * (1 - clamp(fraction, 0, 1));
    const cx = 60, cy = 62, r1 = 43, r2 = 57;
    line.setAttribute("x1", (cx + r1 * Math.cos(a)).toFixed(2));
    line.setAttribute("y1", (cy - r1 * Math.sin(a)).toFixed(2));
    line.setAttribute("x2", (cx + r2 * Math.cos(a)).toFixed(2));
    line.setAttribute("y2", (cy - r2 * Math.sin(a)).toFixed(2));
    line.setAttribute("visibility", "visible");
  }
  function setLevel(el, level) {
    el.classList.remove("ok", "warn", "danger");
    if (level) el.classList.add(level);
  }

  // ---------- Gráficos (sparklines) ----------
  const SVG_NS = "http://www.w3.org/2000/svg";
  function drawSpark(svg, rangeEl, data, unit) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (data.length < 2) { rangeEl.textContent = data.length ? `${fmt(data[0], 1)} ${unit}` : "--"; return; }
    const W = 300, H = 80, pad = 8;
    let min = Math.min(...data), max = Math.max(...data);
    rangeEl.textContent = `${fmt(min, 1)} – ${fmt(max, 1)} ${unit}`;
    if (min === max) { min -= 1; max += 1; }
    const x = (i) => pad + (i / (data.length - 1)) * (W - 2 * pad);
    const y = (v) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
    const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);

    const area = document.createElementNS(SVG_NS, "polygon");
    area.setAttribute("points", `${pad},${H - pad} ${pts.join(" ")} ${W - pad},${H - pad}`);
    area.style.fill = "var(--primary)";
    area.style.opacity = "0.12";
    const line = document.createElementNS(SVG_NS, "polyline");
    line.setAttribute("points", pts.join(" "));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linejoin", "round");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    line.style.stroke = "var(--primary)";
    svg.append(area, line);
  }

  // ---------- Monitor MQTT ----------
  function span(cls, text) {
    const s = document.createElement("span");
    s.className = cls;
    s.textContent = text;       // textContent: nunca interpreta HTML vindo do broker
    return s;
  }
  function logLine(dir, topic, payload, retained) {
    const ul = $("log");
    const li = document.createElement("li");
    li.className = dir;
    li.title = topic;
    const shortTopic = topic.startsWith(BASE + "/") ? topic.slice(BASE.length + 1) : topic;
    li.append(span("t", hhmmss()), span("dir", dir === "in" ? "↓" : "↑"), span("topic", shortTopic), span("payload", payload));
    if (retained) li.append(span("badge", "retain"));
    ul.prepend(li);
    while (ul.children.length > MAX_LOG) ul.lastElementChild.remove();
  }

  // ---------- Renderização ----------
  const BROKER_TXT = { conectando: "conectando…", conectado: "conectado", reconectando: "reconectando…", desconectado: "desconectado", erro: "erro" };
  const DEVICE_TXT = { desconhecido: "aguardando…", online: "online", offline: "offline" };
  const MOTIVO_TXT = (m) => ({
    nenhum: "Nenhuma condição de risco",
    porcao: `Porção acima de ${fmt(S.limPeso, 0)} g`,
    temperatura: `Temperatura acima de ${fmt(S.limTemp, 0)} °C`,
    "porcao+temperatura": `Porção acima de ${fmt(S.limPeso, 0)} g e temperatura acima de ${fmt(S.limTemp, 0)} °C`,
  }[m] || "--");

  let brokerMsg = "";

  function renderStatus() {
    const demo = S.mode === "demo";
    const pb = $("pill-broker");
    pb.dataset.state = demo ? "demo" : S.broker;
    pb.lastElementChild.textContent = demo ? "Modo demonstração" : `Broker: ${BROKER_TXT[S.broker] || S.broker}`;
    const pd = $("pill-device");
    pd.dataset.state = S.device;
    pd.lastElementChild.textContent = `Dispositivo: ${demo ? "simulado" : DEVICE_TXT[S.device]}`;

    const banner = $("banner");
    if (demo) {
      banner.hidden = true;
    } else if (S.broker === "erro") {
      banner.hidden = false; banner.dataset.kind = "erro";
      banner.textContent = `Não foi possível usar o broker MQTT${brokerMsg ? ": " + brokerMsg : ""}.`;
    } else if (S.device === "offline") {
      banner.hidden = false; banner.dataset.kind = "";
      banner.textContent = "Dispositivo offline — exibindo os últimos valores recebidos. Inicie a simulação no Wokwi.";
    } else {
      banner.hidden = true;
    }
    renderClock();
  }

  function renderClock() {
    const el = $("updated");
    const age = S.lastData === null ? null : Date.now() - S.lastData;
    const stale = S.device === "offline" || (age !== null && age > STALE_MS);
    el.textContent = age === null ? "sem dados ainda" : `Atualizado ${rel(age)}`;
    el.classList.toggle("stale", age !== null && age > STALE_MS);
    document.body.classList.toggle("stale", stale);
  }

  function renderPeso() {
    $("peso-valor").textContent = fmt(S.peso, 1);
    const arc = $("peso-arc");
    setArc(arc, S.peso === null ? 0 : S.peso / PESO_MAX);
    setLevel(arc, S.peso !== null && S.limPeso !== null && S.peso > S.limPeso ? "danger" : null);
    placeMarker($("peso-limit"), S.limPeso === null ? null : S.limPeso / PESO_MAX);
    $("peso-hint").textContent = S.limPeso === null
      ? "Limite de porção: --"
      : `Limite de porção: ${fmt(S.limPeso, 0)} g (a marca no medidor)`;
  }

  function renderCal() {
    $("cal-refeicao").textContent = fmt(S.calRef, 0);
    $("cal-dia").textContent = fmt(S.calDia, 0);
    $("meta-valor").textContent = fmt(S.meta, 0);
    let pct = S.progresso;
    if (pct === null && S.meta && S.calDia !== null) pct = (S.calDia / S.meta) * 100;
    $("meta-pct").textContent = pct === null ? "--%" : `${fmt(pct, 0)}%`;
    const fill = $("meta-fill");
    fill.style.width = `${pct === null ? 0 : clamp(pct, 0, 100)}%`;
    fill.classList.toggle("danger", pct !== null && pct >= 100);
    fill.classList.toggle("warn", pct !== null && pct >= 80 && pct < 100);
    const note = $("meta-note");
    if (S.meta !== null && S.calDia !== null) {
      note.textContent = S.calDia > S.meta
        ? `Meta ultrapassada em ${fmt(S.calDia - S.meta, 0)} kcal`
        : `Restam ${fmt(S.meta - S.calDia, 0)} kcal para a meta`;
    } else {
      note.innerHTML = "&nbsp;";
    }
  }

  function renderAmbiente() {
    $("temp-valor").textContent = fmt(S.temp, 1);
    const arc = $("temp-arc");
    setArc(arc, S.temp === null ? 0 : (S.temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN));
    let level = null;
    if (S.temp !== null && S.limTemp !== null) level = S.temp > S.limTemp ? "danger" : S.temp > S.limTemp - 3 ? "warn" : "ok";
    setLevel(arc, level);
    placeMarker($("temp-limit"), S.limTemp === null ? null : (S.limTemp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN));
    $("temp-hint").textContent = S.limTemp === null
      ? "Limite de segurança: --"
      : `Limite de segurança: ${fmt(S.limTemp, 0)} °C (a marca no medidor)`;

    $("umid-valor").textContent = fmt(S.umid, 1);
    setArc($("umid-arc"), S.umid === null ? 0 : S.umid / 100);
  }

  function renderAlarme() {
    const offline = S.device === "offline";
    const known = S.alarme !== null && !offline;      // offline = não dá pra saber o estado do alarme
    const on = known && S.alarme === 1;
    $("alarme-dot").dataset.state = !known ? "unk" : on ? "on" : "off";
    $("card-alarme").classList.toggle("alarm-on", on);
    $("alarme-titulo").textContent = offline ? "Sem dados" : S.alarme === null ? "--" : on ? "ALARME ATIVO" : "Tudo normal";
    $("alarme-motivo").textContent = offline ? "Dispositivo offline" : S.alarme === null ? "Aguardando o dispositivo…" : MOTIVO_TXT(S.motivo || (on ? "" : "nenhum"));
  }

  function renderTampa() {
    const open = S.tampa === 1;
    $("lid-icon").classList.toggle("open", open);
    $("tampa-estado").textContent = S.tampa === null ? "--" : open ? "Aberta" : "Fechada";
    $("btn-tampa").textContent = open ? "Fechar tampa" : "Abrir tampa";
  }

  function renderFood() {
    document.querySelectorAll("#food-seg button").forEach((b) => {
      const active = Number(b.dataset.food) === S.alimento;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  function renderSparks() {
    drawSpark($("spark-peso"), $("spark-peso-range"), hist.peso, "g");
    drawSpark($("spark-temp"), $("spark-temp-range"), hist.temp, "°C");
  }

  const renderListeners = [];      // a cena 3D se registra aqui (BalancaApp.onRender)
  function render() {
    renderStatus(); renderPeso(); renderCal(); renderAmbiente();
    renderAlarme(); renderTampa(); renderFood(); renderSparks();
    renderListeners.forEach((fn) => { try { fn(S); } catch (e) { console.error(e); } });
  }

  // ---------- Mensagens recebidas ----------
  function pushHist(arr, v) { arr.push(v); while (arr.length > MAX_HIST) arr.shift(); }

  function onMessage(topic, raw, retained, source) {
    if ((source || "mqtt") !== S.mode) return;    // no modo demo ignoramos o broker real (e vice-versa)
    logLine("in", topic, raw, retained);
    if (!topic.startsWith(BASE + "/")) return;
    const key = topic.slice(BASE.length + 1);
    const live = !retained;                       // retain=true => valor guardado pelo broker (antigo)
    const n = num(raw);

    switch (key) {
      case "peso":
        if (n === null) return;
        S.peso = n; if (live) { S.lastData = Date.now(); pushHist(hist.peso, n); }
        break;
      case "calorias/refeicao": if (n === null) return; S.calRef = n; break;
      case "calorias/dia":      if (n === null) return; S.calDia = n; break;
      case "meta/progresso":    if (n === null) return; S.progresso = n; break;
      case "ambiente/temperatura":
        if (n === null) return;
        S.temp = n; if (live) pushHist(hist.temp, n);
        break;
      case "ambiente/umidade":  if (n === null) return; S.umid = n; break;
      case "alarme/status":     if (n === null) return; S.alarme = n === 1 ? 1 : 0; break;
      case "alarme/motivo":     S.motivo = raw; break;
      case "tampa/estado":      if (n === null) return; S.tampa = n === 1 ? 1 : 0; break;
      case "config/alimento":   if (n === null || n < 0 || n > 2) return; S.alimento = n; break;
      case "config/meta":       if (n === null) return; S.meta = n; break;
      case "config/limite_peso":         if (n === null) return; S.limPeso = n; break;
      case "config/limite_temperatura":  if (n === null) return; S.limTemp = n; break;
      case "status":            S.device = raw === "online" ? "online" : "offline"; break;
      default: return;                            // inclui cmd/* (eco dos nossos comandos)
    }
    render();
  }

  // ---------- Comandos (apps -> ESP32) ----------
  function sendCmd(sub, value, retain) {
    if (S.mode === "demo") {                      // modo demonstração: quem recebe é o dispositivo simulado
      logLine("out", `${BASE}/cmd/${sub}`, String(value), !!retain);
      if (window.BalancaDemo) window.BalancaDemo.command(sub, value);
      return true;
    }
    if (!client || !client.connected) { toast("Sem conexão com o broker MQTT.", "erro"); return false; }
    const topic = `${BASE}/cmd/${sub}`;
    client.publish(topic, String(value), { qos: 0, retain: !!retain }, (err) => {
      if (err) toast("Falha ao enviar o comando.", "erro");
    });
    logLine("out", topic, String(value), !!retain);
    return true;
  }
  const offlineNote = () => (S.device === "offline" ? " O dispositivo está offline: será aplicado quando ele voltar." : "");

  // Comandos de alto nível (usados pelos botões 2D e pelos controles da cena 3D)
  const commands = {
    setFood(n) {
      if (sendCmd("alimento", n, true)) toast(`Alimento: ${FOODS[n]} — comando enviado.${offlineNote()}`);
    },
    toggleLid() {
      const want = S.tampa === 1 ? 0 : 1;
      if (sendCmd("tampa", want, true)) toast(`${want ? "Abrir" : "Fechar"} tampa — comando enviado.${offlineNote()}`);
    },
    setGoal(raw) {
      const v = num(raw);
      if (v === null || v < 100 || v > 10000) { toast("Informe uma meta entre 100 e 10000 kcal.", "erro"); return false; }
      if (sendCmd("meta", Math.round(v), true)) { toast(`Meta de ${fmt(Math.round(v))} kcal enviada.${offlineNote()}`); return true; }
      return false;
    },
    resetDay() {
      if (!window.confirm("Zerar o total de calorias do dia?")) return;
      if (sendCmd("resetar", 1, false)) toast("Total do dia zerado — comando enviado.");
    },
  };

  function bindUI() {
    document.querySelectorAll("#food-seg button").forEach((b) =>
      b.addEventListener("click", () => commands.setFood(Number(b.dataset.food))));

    $("btn-tampa").addEventListener("click", () => commands.toggleLid());

    $("form-meta").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("meta-input");
      if (commands.setGoal(input.value)) input.value = "";
    });

    $("btn-reset").addEventListener("click", () => commands.resetDay());

    $("btn-clear-log").addEventListener("click", () => { $("log").textContent = ""; });
  }

  // ---------- Conexão MQTT ----------
  function setBroker(state, msg) {
    S.broker = state;
    brokerMsg = msg || "";
    if (state !== "conectado" && S.mode !== "demo") S.device = "desconhecido";   // sem broker não dá pra saber
    renderStatus();
  }

  function connect() {
    if (!PROJECT_ID) { setBroker("erro", "defina o PROJECT_ID em config.js"); return; }
    if (typeof mqtt === "undefined") { setBroker("erro", "a biblioteca MQTT não carregou (sem internet?)"); return; }

    setBroker("conectando");
    client = mqtt.connect(CFG.BROKER_URL, {
      clientId: "web-" + Math.random().toString(16).slice(2, 10),
      clean: true,
      keepalive: 30,
      connectTimeout: 10000,
      reconnectPeriod: 2000,
    });

    client.on("connect", () => {
      setBroker("conectado");
      client.subscribe(`${BASE}/#`, { qos: 0 }, (err) => { if (err) setBroker("erro", "falha ao assinar os tópicos"); });
    });
    client.on("reconnect", () => setBroker("reconectando"));
    client.on("offline", () => { if (S.broker === "conectado") setBroker("desconectado"); });
    client.on("error", (err) => setBroker("erro", err && err.message));
    client.on("message", (topic, payload, packet) =>
      onMessage(topic, payload.toString(), !!(packet && packet.retain)));
  }

  // ---------- Troca de modo (dispositivo real <-> demonstração) ----------
  function setMode(mode) {
    if (mode === S.mode) return;
    S.mode = mode;
    Object.assign(S, {
      peso: null, calRef: null, calDia: null, progresso: null, temp: null, umid: null,
      alarme: null, motivo: null, tampa: null, alimento: null, meta: null,
      limPeso: null, limTemp: null, lastData: null, device: mode === "demo" ? "online" : "desconhecido",
    });
    hist.peso.length = 0; hist.temp.length = 0;
    $("log").textContent = "";
    if (mode === "mqtt" && client && client.connected) {
      // volta ao dispositivo real: assina de novo para o broker reenviar os valores guardados (retain)
      client.unsubscribe(`${BASE}/#`, () => client.subscribe(`${BASE}/#`, { qos: 0 }));
    }
    render();
  }

  // ---------- API pública (usada por demo.js e twin3d.js) ----------
  window.BalancaApp = {
    state: S,                      // objeto vivo: sempre reflete o último valor recebido
    hist,
    base: BASE,
    fmt, clamp, toast,
    commands,
    setMode,
    inject: (sub, payload, retained) => onMessage(`${BASE}/${sub}`, String(payload), !!retained, "demo"),
    onRender: (fn) => renderListeners.push(fn),
    // "ao vivo" = existe um dispositivo (real ou simulado) enviando dados agora
    live: () => S.mode === "demo" || (S.broker === "conectado" && S.device === "online"),
  };

  // ---------- Início ----------
  $("base-topic").textContent = `${BASE}/#`;
  bindUI();
  render();
  connect();
  setInterval(renderClock, 1000);
})();
