/* ===========================================================================
   Gêmeo digital 3D da balança nutricional  —  Three.js r128
   ---------------------------------------------------------------------------
   Lê os dados do painel (window.BalancaApp.state, alimentado por MQTT ou pelo
   modo demonstração) e desenha uma cozinha em 3D:
     • prato com o alimento escolhido que "voa" até a balança quando há peso;
     • visor LCD da balança, LED e buzzer do alarme (ondas de som);
     • recipiente com tampa presa a um servo (abre/fecha, clicável);
     • estação de temperatura/umidade (DHT22) e pote da meta calórica do dia.
   Tudo é desenhado só com formas básicas (sem arquivos de modelo).
   =========================================================================== */
(() => {
  "use strict";

  const App = window.BalancaApp;
  const stage = document.getElementById("stage");
  const msgEl = document.getElementById("stage-msg");
  if (!App || !stage) return;
  const S = App.state;
  const $ = (id) => document.getElementById(id);

  function fail(text, err) {
    if (err) console.error("[3D]", err);
    msgEl.hidden = false;
    msgEl.textContent = text;
    stage.classList.add("no3d");
  }
  if (typeof THREE === "undefined") {
    fail("Não foi possível carregar o Three.js (é preciso internet). O painel 2D abaixo continua funcionando.");
    return;
  }
  try {
    start();
  } catch (err) {
    fail("Não foi possível iniciar o 3D: " + (err && err.message ? err.message : err), err);
  }

  function start() {
    // ------------------------------------------------------------------ utilidades
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));      // suavização independente do fps
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const SMALL = window.innerWidth < 700;
    function rng(seed) {                                                       // gerador pseudoaleatório fixo (a cena é sempre igual)
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const safe = (nome, fn) => {                                               // se uma peça falhar, o resto da cena continua
      try { return fn(); } catch (e) { console.error("[3D] falha ao montar:", nome, e); return null; }
    };

    // ------------------------------------------------------------------ renderer / cena / câmera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    stage.insertBefore(canvas, stage.firstChild);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const root = new THREE.Group();
    scene.add(root);
    const camera = new THREE.PerspectiveCamera(36, 1.8, 0.1, 120);

    // luzes (modelo "clássico" do r128: sem tone mapping, cores como foram escritas)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc3cde0, 0.5));
    scene.add(new THREE.AmbientLight(0x9fb0d0, 0.08));
    const sun = new THREE.DirectionalLight(0xfff3e0, 0.52);
    sun.position.set(-7, 13, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 2, far: 45 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xbfd2ff, 0.18);
    fill.position.set(8, 6, 7);
    scene.add(fill);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.1);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);
    const alarmLight = new THREE.PointLight(0xff3a30, 0, 11, 2);
    alarmLight.position.set(2.2, 1.2, 3.4);
    scene.add(alarmLight);

    // ------------------------------------------------------------------ materiais e atalhos
    const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.6, metalness: 0 }, o || {}));
    const M = {
      stone: std("#e3d9c8", { roughness: 0.88 }),
      wood: std("#b98b5e", { roughness: 0.72 }),
      cork: std("#c9ae85", { roughness: 0.9 }),
      porcelain: std("#eef1f6", { roughness: 0.42 }),
      porcelainDim: std("#c9d1de", { roughness: 0.46 }),
      steel: std("#cdd5e0", { roughness: 0.34, metalness: 0.25 }),
      steelDark: std("#98a3b4", { roughness: 0.45, metalness: 0.25 }),
      dark: std("#1b2230", { roughness: 0.5 }),
      plate: std("#f7f9fc", { roughness: 0.32, side: THREE.DoubleSide }),
      blue: std("#3b6fe0", { roughness: 0.4 }),
      teal: std("#1fa6a0", { roughness: 0.34 }),
      tealLight: std("#8fe0d9", { roughness: 0.4 }),
      servo: std("#2d74e6", { roughness: 0.5 }),
      white: std("#fbfcfe", { roughness: 0.5 }),
    };
    const glassMat = (color, opacity) =>
      new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: opacity, shininess: 90, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false });

    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, seg, open) => new THREE.CylinderGeometry(rt, rb, h, seg || 32, 1, !!open);
    const sph = (r, ws, hs) => new THREE.SphereGeometry(r, ws || 20, hs || 14);
    function add(parent, geo, mat, x, y, z, o) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = !(o && o.cast === false);
      m.receiveShadow = !(o && o.recv === false);
      parent.add(m);
      return m;
    }
    function canvasTex(w, h) {                                                // textura desenhada em <canvas> (visores)
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = maxAniso;
      return { c: c, g: c.getContext("2d"), tex: tex, key: "" };
    }
    const FONT = '"Bricolage Grotesque", "Figtree", system-ui, sans-serif';
    const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

    // posições (1 unidade ≈ 10 cm)
    const SC = { x: 0, z: 0.2, topY: 1.04 };         // balança
    const REST = { x: -4.7, y: 0.06, z: 1.0 };       // onde o prato espera
    const CT = { x: 6.0, z: 1.0 };                   // recipiente com tampa
    const ST = { x: -6.6, z: -1.9 };                 // estação de temperatura/umidade
    const JR = { x: 3.9, z: -2.3 };                  // pote da meta calórica
    const LIM = { peso: 300, temp: 30 };             // usados só enquanto o dispositivo não informa os limites

    // ------------------------------------------------------------------ bancada
    safe("bancada", () => {
      add(root, box(17.4, 0.5, 6.9), M.stone, 0, -0.25, 0, { cast: false });
      add(root, box(17.7, 0.55, 7.2), M.wood, 0, -0.775, 0, { cast: false });
      add(root, box(17.4, 0.05, 0.06), M.porcelain, 0, -0.02, 3.44, { cast: false, recv: false });   // frisa clara na borda
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.ShadowMaterial({ opacity: 0.17 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.1;
      floor.receiveShadow = true;
      scene.add(floor);
      // tapete de cortiça onde o prato espera
      add(root, cyl(1.8, 1.8, 0.06, 56), M.cork, REST.x, 0.03, REST.z, { cast: false });
    });

    // ------------------------------------------------------------------ balança
    const scaleP = safe("balança", () => {
      const g = new THREE.Group();
      g.position.set(SC.x, 0, SC.z);
      root.add(g);
      add(g, box(5.2, 0.62, 3.9), M.porcelain, 0, 0.31, 0);
      add(g, box(5.0, 0.2, 3.7), M.porcelainDim, 0, 0.72, 0);
      [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]].forEach((p) => add(g, cyl(0.22, 0.26, 0.06, 16), M.dark, p[0], 0.03, p[1], { cast: false }));
      add(g, cyl(0.5, 0.62, 0.16, 28), M.steelDark, 0, 0.9, 0);
      add(g, cyl(1.75, 1.62, 0.14, 56), M.steel, 0, 0.97, 0);
      const ring = add(g, new THREE.TorusGeometry(1.7, 0.028, 8, 64), M.porcelain, 0, 1.04, 0, { cast: false });
      ring.rotation.x = Math.PI / 2;

      add(g, box(5.22, 0.05, 0.03), M.blue, 0, 0.58, 1.955, { cast: false });                  // faixa azul da marca
      // painel frontal: visor LCD, LED e buzzer
      add(g, box(3.4, 0.46, 0.05), M.dark, -0.5, 0.33, 1.95, { cast: false });
      const lcd = canvasTex(1024, 128);
      const lcdMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), new THREE.MeshBasicMaterial({ map: lcd.tex }));
      lcdMesh.position.set(-0.5, 0.33, 1.98);
      g.add(lcdMesh);
      const ledMat = new THREE.MeshStandardMaterial({ color: "#6b1b1f", emissive: "#ff2a2a", emissiveIntensity: 0.15, roughness: 0.3 });
      add(g, sph(0.13, 16, 12), ledMat, 1.62, 0.33, 1.98, { cast: false });
      const bz = add(g, cyl(0.25, 0.25, 0.07, 28), M.dark, 2.15, 0.33, 1.97);
      bz.rotation.x = Math.PI / 2;
      const hole = add(g, cyl(0.08, 0.08, 0.08, 16), std("#0b0f17"), 2.15, 0.33, 1.975, { cast: false });
      hole.rotation.x = Math.PI / 2;

      function drawLcd(text, unit, mode) {
        const key = text + "|" + unit + "|" + mode;
        if (lcd.key === key) return;
        lcd.key = key;
        const x = lcd.g, W = lcd.c.width, H = lcd.c.height;
        const bg = x.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#d8e8d0");
        bg.addColorStop(1, "#bbd3b3");
        x.fillStyle = bg;
        x.fillRect(0, 0, W, H);
        x.strokeStyle = "rgba(25,45,30,.28)";
        x.lineWidth = 6;
        x.strokeRect(3, 3, W - 6, H - 6);
        x.textBaseline = "middle";
        x.textAlign = "right";
        x.font = "700 " + Math.round(H * 0.8) + "px " + MONO;
        x.fillStyle = "rgba(22,48,31,.08)";                                    // segmentos "apagados"
        x.fillText("888.8", W - 190, H * 0.54);
        x.fillStyle = mode === "alarm" ? "#b3261e" : mode === "off" ? "rgba(22,48,31,.35)" : "#16301f";
        x.fillText(text, W - 190, H * 0.54);
        x.textAlign = "left";
        x.font = "700 " + Math.round(H * 0.42) + "px " + MONO;
        x.fillText(unit, W - 170, H * 0.66);
        x.textAlign = "left";
        x.font = "600 " + Math.round(H * 0.2) + "px " + FONT;
        x.fillStyle = "rgba(22,48,31,.55)";
        x.fillText("PESO", 34, H * 0.2);
        lcd.tex.needsUpdate = true;
      }
      drawLcd("0.0", "g", "ok");
      return { group: g, ledMat: ledMat, drawLcd: drawLcd, buzzer: { x: 2.15, y: 0.33, z: 1.99 } };
    });

    // ------------------------------------------------------------------ prato
    const plate = new THREE.Group();
    root.add(plate);
    safe("prato", () => {
      const pts = [[0, 0.02], [0.5, 0.02], [0.62, 0], [0.78, 0], [0.95, 0.06], [1.25, 0.14], [1.5, 0.25], [1.53, 0.285], [1.48, 0.3], [1.3, 0.22], [0.95, 0.11], [0.6, 0.085], [0, 0.08]]
        .map((p) => new THREE.Vector2(p[0], p[1]));
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), M.plate);
      body.castShadow = true;
      body.receiveShadow = true;
      plate.add(body);
      const rim = add(plate, new THREE.TorusGeometry(1.4, 0.022, 8, 72), M.blue, 0, 0.262, 0, { cast: false });
      rim.rotation.x = Math.PI / 2;
    });

    // ------------------------------------------------------------------ alimentos (sobre o prato)
    const foodRoot = new THREE.Group();
    foodRoot.position.y = 0.085;
    plate.add(foodRoot);

    // ARROZ: montinho de grãos (peça única instanciada = barato para a GPU)
    function buildRice() {
      const holder = new THREE.Group();
      const mound = new THREE.Group();
      holder.add(mound);
      const N = 720;
      const grains = new THREE.InstancedMesh(sph(0.075, 7, 5), std("#f3ead3", { roughness: 0.55 }), N);
      grains.castShadow = true;
      grains.receiveShadow = true;
      grains.frustumCulled = false;
      const r = rng(11);
      const d = new THREE.Object3D();
      for (let i = 0; i < N; i++) {
        const ang = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * 0.98;
        const top = 0.62 * Math.pow(Math.max(0, 1 - rad * rad), 0.7);
        const y = 0.04 + top * (1 - Math.pow(r(), 2.4));
        d.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
        d.rotation.set(r() * 3.14, r() * 3.14, r() * 3.14);
        const s = 0.9 + r() * 0.35;
        d.scale.set(1.7 * s, 0.62 * s, 0.62 * s);
        d.updateMatrix();
        grains.setMatrixAt(i, d.matrix);
      }
      grains.instanceMatrix.needsUpdate = true;
      mound.add(grains);
      // salsinha por cima (só para dar cor)
      const herbs = new THREE.InstancedMesh(sph(0.06, 6, 4), std("#4caf6d", { roughness: 0.7 }), 16);
      herbs.frustumCulled = false;
      for (let i = 0; i < 16; i++) {
        const ang = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * 0.5;
        const y = 0.04 + 0.62 * Math.pow(Math.max(0, 1 - rad * rad), 0.7) + 0.02;
        d.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
        d.rotation.set(0, r() * 3, 0);
        d.scale.set(1.6, 0.4, 1);
        d.updateMatrix();
        herbs.setMatrixAt(i, d.matrix);
      }
      herbs.instanceMatrix.needsUpdate = true;
      mound.add(herbs);

      let a = 0.6, aT = 0.6;
      return {
        holder: holder,
        setPortion: (peso) => { aT = clamp(peso / 450, 0.1, 1); },
        update: (dt) => {
          a = damp(a, aT, 6, dt);
          const sxz = 0.55 + 0.45 * a;
          mound.scale.set(sxz, 0.5 + 0.5 * a, sxz);
          grains.count = Math.max(40, Math.floor(N * (0.28 + 0.72 * a)));
          herbs.visible = a > 0.35;
        },
      };
    }

    // FRANGO: coxinhas douradas (até 5); a quantidade e o tamanho acompanham o peso
    function buildChicken() {
      const holder = new THREE.Group();
      const meatM = std("#c4772f", { roughness: 0.42 });
      const boneM = std("#f6efdd", { roughness: 0.6 });
      const slots = [];
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Group();
        const meat = add(p, sph(0.34, 18, 14), meatM, -0.12, 0.28, 0);
        meat.scale.set(1.3, 0.86, 0.95);
        const taper = add(p, cyl(0.06, 0.25, 0.62, 14), meatM, 0.36, 0.25, 0);
        taper.rotation.z = -Math.PI / 2;
        const bone = add(p, cyl(0.055, 0.055, 0.42, 10), boneM, 0.88, 0.25, 0);
        bone.rotation.z = Math.PI / 2;
        add(p, sph(0.075, 10, 8), boneM, 1.09, 0.25, 0.055);
        add(p, sph(0.075, 10, 8), boneM, 1.09, 0.25, -0.055);
        holder.add(p);
        slots.push({ g: p, angle: (i * Math.PI * 2) / 5, angleT: (i * Math.PI * 2) / 5, k: 0, kT: 0 });
      }
      return {
        holder: holder,
        setPortion: (peso) => {
          const n = clamp(Math.ceil(peso / 110), 1, 5);
          const frac = clamp((peso - (n - 1) * 110) / 110, 0.35, 1);
          const base = n === 1 ? 0.5 : 0.35;
          slots.forEach((s, i) => {
            s.angleT = base + (i * Math.PI * 2) / n;
            s.kT = i < n - 1 ? 1 : i === n - 1 ? 0.6 + 0.4 * frac : 0;
          });
        },
        update: (dt) => {
          slots.forEach((s) => {
            s.angle = damp(s.angle, s.angleT, 7, dt);
            s.k = damp(s.k, s.kT, 9, dt);
            s.g.visible = s.k > 0.02;
            s.g.position.set(Math.cos(s.angle) * 0.38, 0, Math.sin(s.angle) * 0.38);
            s.g.rotation.y = -s.angle;                                         // a ponta do osso aponta para fora
            s.g.scale.setScalar(0.82 * Math.max(s.k, 0.001));
          });
        },
      };
    }

    // OVO: metades de ovo cozido com a gema para cima (até 8)
    function buildEgg() {
      const holder = new THREE.Group();
      const whiteM = std("#fffdf7", { roughness: 0.35, side: THREE.DoubleSide });
      const yolkM = std("#ffc43a", { roughness: 0.32, emissive: "#ff9d00", emissiveIntensity: 0.06 });
      const slots = [];
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Group();
        const inner = new THREE.Group();
        inner.position.y = 0.25;
        p.add(inner);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), whiteM);
        dome.rotation.x = Math.PI;                                             // meia esfera virada para baixo
        dome.scale.set(1, 0.72, 1.35);
        dome.castShadow = true;
        dome.receiveShadow = true;
        inner.add(dome);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), whiteM);
        face.rotation.x = -Math.PI / 2;                                        // face cortada, voltada para cima
        face.scale.set(1, 1.35, 1);
        face.position.y = 0.004;
        face.receiveShadow = true;
        inner.add(face);
        const yolk = new THREE.Mesh(sph(0.17, 16, 10), yolkM);
        yolk.scale.set(1, 0.5, 1.15);
        yolk.castShadow = true;
        inner.add(yolk);
        holder.add(p);
        slots.push({ g: p, angle: (i * Math.PI * 2) / 8, angleT: 0, rad: 0, radT: 0, k: 0, kT: 0 });
      }
      return {
        holder: holder,
        setPortion: (peso) => {
          const n = clamp(Math.ceil(peso / 48), 1, 8);
          const frac = clamp((peso - (n - 1) * 48) / 48, 0.4, 1);
          const R = n === 1 ? 0 : clamp(0.32 + n * 0.085, 0.42, 0.95);
          slots.forEach((s, i) => {
            s.angleT = 0.4 + (i * Math.PI * 2) / n;
            s.radT = R;
            s.kT = i < n - 1 ? 1 : i === n - 1 ? 0.65 + 0.35 * frac : 0;
          });
        },
        update: (dt) => {
          slots.forEach((s) => {
            s.angle = damp(s.angle, s.angleT, 7, dt);
            s.rad = damp(s.rad, s.radT, 6, dt);
            s.k = damp(s.k, s.kT, 9, dt);
            s.g.visible = s.k > 0.02;
            s.g.position.set(Math.cos(s.angle) * s.rad, 0, Math.sin(s.angle) * s.rad);
            s.g.rotation.y = -s.angle;                                         // eixo maior acompanha a borda do prato
            s.g.scale.setScalar(0.72 * Math.max(s.k, 0.001));
          });
        },
      };
    }

    const foods = [safe("arroz", buildRice), safe("frango", buildChicken), safe("ovo", buildEgg)];
    const foodK = [1, 0, 0];
    foods.forEach((f) => { if (f) foodRoot.add(f.holder); });
    const PORCAO_PADRAO = [300, 240, 150];       // porção de exemplo mostrada no prato que espera
    function updateFoods(tipo, peso, dt) {
      foods.forEach((f, i) => {
        if (!f) return;
        foodK[i] = damp(foodK[i], i === tipo ? 1 : 0, REDUCED ? 40 : 10, dt);
        f.holder.visible = foodK[i] > 0.015;
        f.holder.scale.setScalar(Math.max(foodK[i], 0.001));
        if (f.holder.visible) f.update(dt);
      });
      if (foods[tipo]) foods[tipo].setPortion(peso);
    }

    // ------------------------------------------------------------------ recipiente com tampa + servo
    const lidP = safe("recipiente", () => {
      const g = new THREE.Group();
      g.position.set(CT.x, 0, CT.z);
      g.rotation.y = -0.28;
      root.add(g);
      add(g, cyl(1.45, 1.3, 1.2, 40, true), glassMat("#cfe3ff", 0.28), 0, 0.6, 0, { cast: false }).renderOrder = 2;
      add(g, cyl(1.3, 1.3, 0.08, 40), M.white, 0, 0.04, 0);
      const rim = add(g, new THREE.TorusGeometry(1.45, 0.055, 8, 56), M.porcelain, 0, 1.2, 0, { cast: false });
      rim.rotation.x = Math.PI / 2;
      // comida guardada dentro
      [["#4caf6d", -0.55, 0.3, 0.3], ["#4caf6d", 0.1, 0.28, 0.6], ["#f08a35", 0.55, 0.26, -0.15], ["#e5484d", -0.2, 0.26, -0.6],
       ["#f2c744", 0.62, 0.25, 0.5], ["#4caf6d", -0.7, 0.28, -0.4], ["#f08a35", 0.05, 0.25, -0.1]].forEach((v) => {
        add(g, sph(v[3] || 0.27, 14, 10), std(v[0], { roughness: 0.6 }), v[1], 0.08 + (v[3] || 0.27) * 0.9, v[2]);
      });

      // tampa articulada na parte de trás (dobradiça)
      const pivot = new THREE.Group();
      pivot.position.set(0, 1.2, -1.45);
      g.add(pivot);
      add(pivot, cyl(1.5, 1.5, 0.14, 44), M.teal, 0, 0.08, 1.45);
      add(pivot, cyl(0.2, 0.26, 0.14, 18), M.tealLight, 0, 0.22, 1.45);
      const barrel = add(pivot, cyl(0.1, 0.1, 0.9, 12), M.dark, 0, 0.02, 0, { cast: false });
      barrel.rotation.z = Math.PI / 2;
      const pickables = [];
      pivot.traverse((o) => { if (o.isMesh && o !== barrel) { o.userData.pick = "lid"; pickables.push(o); } });

      // servo SG90 atrás da dobradiça, com a "asa" que gira junto
      const servo = new THREE.Group();
      servo.position.set(0, 1.05, -2.15);
      g.add(servo);
      add(servo, box(0.9, 0.55, 0.42), M.servo, 0, 0, 0);
      add(servo, box(1.3, 0.06, 0.42), M.servo, 0, 0.1, 0);
      const horn = new THREE.Group();
      horn.position.set(0.5, 0, 0);
      servo.add(horn);
      const hub = add(horn, cyl(0.12, 0.12, 0.1, 16), M.white, 0.05, 0, 0, { cast: false });
      hub.rotation.z = Math.PI / 2;
      add(horn, box(0.08, 0.1, 0.6), M.white, 0.08, 0, 0.27, { cast: false });

      return {
        group: g,
        pickables: pickables,
        // k: 0 = fechada (servo 0°), 1 = aberta (servo 90°)
        setOpen: (k) => {
          pivot.rotation.x = -k * 1.82;
          horn.rotation.x = -k * (Math.PI / 2);
        },
      };
    });

    // ------------------------------------------------------------------ estação de temperatura e umidade (DHT22)
    const COR = { verde: new THREE.Color("#2fa36b"), ambar: new THREE.Color("#f0a229"), vermelho: new THREE.Color("#e5484d"), azul: new THREE.Color("#3b82f6") };
    const stationP = safe("estação", () => {
      const g = new THREE.Group();
      g.position.set(ST.x, 0, ST.z);
      g.rotation.y = 0.32;
      root.add(g);
      add(g, box(1.9, 0.16, 1.1), M.porcelainDim, 0, 0.08, 0);
      add(g, box(1.7, 3.4, 0.9), M.porcelain, 0, 1.86, 0);
      add(g, box(1.78, 0.1, 0.98), M.porcelainDim, 0, 3.6, 0);
      add(g, box(1.5, 3.0, 0.04), std("#dbe4f2", { roughness: 0.3 }), 0, 1.86, 0.47, { cast: false });

      // termômetro de coluna
      add(g, cyl(0.11, 0.11, 2.6, 16), glassMat("#eaf1ff", 0.45), -0.46, 1.95, 0.52, { cast: false }).renderOrder = 2;
      const liquidMat = new THREE.MeshStandardMaterial({ color: "#2fa36b", emissive: "#2fa36b", emissiveIntensity: 0.25, roughness: 0.3 });
      const liqGeo = cyl(0.07, 0.07, 1, 14);
      liqGeo.translate(0, 0.5, 0);
      const liquid = new THREE.Mesh(liqGeo, liquidMat);
      liquid.position.set(-0.46, 0.68, 0.52);
      g.add(liquid);
      add(g, sph(0.19, 16, 12), liquidMat, -0.46, 0.55, 0.52, { cast: false });
      const yOf = (t) => 0.8 + clamp(t / 50, 0, 1) * 2.3;                      // altura da coluna para t °C
      [0, 10, 20, 40, 50].forEach((t) => add(g, box(0.12, 0.02, 0.02), M.steelDark, -0.24, yOf(t), 0.53, { cast: false }));
      const limTick = add(g, box(0.26, 0.035, 0.02), std("#e5484d"), -0.2, yOf(30), 0.535, { cast: false });

      // visor com os números
      const disp = canvasTex(256, 512);
      const dispMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshBasicMaterial({ map: disp.tex }));
      dispMesh.position.set(0.38, 2.25, 0.5);
      g.add(dispMesh);
      // barra de umidade
      add(g, box(0.8, 0.09, 0.03), std("#cdd6e6"), 0.38, 1.05, 0.5, { cast: false });
      const humGeo = box(1, 0.09, 0.035);
      humGeo.translate(0.5, 0, 0);
      const humFill = new THREE.Mesh(humGeo, std("#3b82f6", { emissive: "#3b82f6", emissiveIntensity: 0.2 }));
      humFill.position.set(-0.02, 1.05, 0.505);
      g.add(humFill);

      function drawDisplay(temp, hum, nivel) {
        const key = App.fmt(temp, 1) + "|" + App.fmt(hum, 0) + "|" + nivel;
        if (disp.key === key) return;
        disp.key = key;
        const x = disp.g, W = disp.c.width, H = disp.c.height;
        x.fillStyle = "#0f1a35";
        x.fillRect(0, 0, W, H);
        x.fillStyle = "#16244a";
        x.fillRect(0, H / 2 - 2, W, 4);
        x.textBaseline = "alphabetic";
        x.textAlign = "left";
        x.font = "600 26px " + FONT;
        x.fillStyle = "#8ea4cf";
        x.fillText("temperatura", 18, 46);
        x.fillText("umidade", 18, H / 2 + 46);
        x.fillStyle = nivel === "danger" ? "#ff7a7f" : nivel === "warn" ? "#ffc15a" : "#ffffff";
        x.font = "800 92px " + FONT;
        x.fillText(temp === null ? "--" : App.fmt(temp, 1), 14, 160);
        x.font = "700 40px " + FONT;
        x.fillText("°C", 18, 214);
        x.fillStyle = "#ffffff";
        x.font = "800 92px " + FONT;
        x.fillText(hum === null ? "--" : App.fmt(hum, 0), 14, H / 2 + 160);
        x.font = "700 40px " + FONT;
        x.fillText("% UR", 18, H / 2 + 214);
        disp.tex.needsUpdate = true;
      }
      drawDisplay(null, null, "ok");

      return {
        group: g,
        apply: (temp, hum, lim, nivel, dt) => {
          liquid.scale.y = 0.02 + (yOf(temp) - 0.8);
          const alvo = nivel === "danger" ? COR.vermelho : nivel === "warn" ? COR.ambar : COR.verde;
          const k = 1 - Math.exp(-6 * dt);
          liquidMat.color.lerp(alvo, k);
          liquidMat.emissive.lerp(alvo, k);
          humFill.scale.x = Math.max(0.001, 0.8 * clamp(hum / 100, 0, 1));
          limTick.position.y = yOf(lim);
        },
        drawDisplay: drawDisplay,
      };
    });

    // ------------------------------------------------------------------ pote da meta calórica do dia
    const jarP = safe("pote", () => {
      const g = new THREE.Group();
      g.position.set(JR.x, 0, JR.z);
      root.add(g);
      add(g, cyl(0.95, 0.95, 2.5, 40, true), glassMat("#dfeaf8", 0.22), 0, 1.31, 0, { cast: false }).renderOrder = 2;
      add(g, cyl(0.95, 0.95, 0.12, 40), glassMat("#cfdcef", 0.5), 0, 0.06, 0, { cast: false });
      const liqGeo = cyl(0.86, 0.86, 1, 36);
      liqGeo.translate(0, 0.5, 0);
      const liqMat = new THREE.MeshStandardMaterial({ color: "#3dbb7d", emissive: "#3dbb7d", emissiveIntensity: 0.18, roughness: 0.25 });
      const liquid = new THREE.Mesh(liqGeo, liqMat);
      liquid.position.y = 0.12;
      g.add(liquid);
      add(g, cyl(1.0, 1.0, 0.2, 40), std("#c19a6b", { roughness: 0.8 }), 0, 2.66, 0);
      add(g, cyl(0.2, 0.24, 0.16, 18), std("#a37b4f", { roughness: 0.8 }), 0, 2.84, 0);
      [0.25, 0.5, 0.75, 1].forEach((f) => {
        const t = add(g, box(f === 1 ? 0.3 : 0.18, 0.03, 0.03), f === 1 ? std("#e5484d") : M.steelDark, -0.69, 0.12 + f * 2.2, 0.69, { cast: false });
        t.rotation.y = -Math.PI / 4;
      });
      const COR_J = { ok: new THREE.Color("#3dbb7d"), warn: new THREE.Color("#f2a93b"), over: new THREE.Color("#e5484d") };
      return {
        group: g,
        apply: (frac, pct, dt) => {
          liquid.scale.y = Math.max(0.01, frac * 2.2);
          const alvo = pct >= 100 ? COR_J.over : pct >= 80 ? COR_J.warn : COR_J.ok;
          const k = 1 - Math.exp(-5 * dt);
          liqMat.color.lerp(alvo, k);
          liqMat.emissive.lerp(alvo, k);
        },
      };
    });

    // ------------------------------------------------------------------ ondas sonoras do alarme (saem do buzzer)
    const rings = safe("ondas", () => {
      if (!scaleP) return null;
      const geo = new THREE.TorusGeometry(0.3, 0.022, 8, 48);
      return [0, 1, 2].map(() => {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#ff3b30", transparent: true, opacity: 0, depthWrite: false }));
        m.position.set(scaleP.buzzer.x, scaleP.buzzer.y, scaleP.buzzer.z + 0.05);
        m.visible = false;
        scaleP.group.add(m);
        return m;
      });
    });

    // ------------------------------------------------------------------ câmera (órbita própria: arrastar, zoom, pinça)
    // th = giro horizontal, ph = ângulo a partir do topo (menor = mais "de cima"), r = distância
    const VIEWS = {
      geral:    { t: [0, 1.1, 0.0],      r: 15,   th: 0,     ph: 1.2,  hw: 8.9 },
      balanca:  { t: [0, 1.7, 0.6],      r: 12,   th: 0,     ph: 1.14, hw: 3.6 },
      tampa:    { t: [6.0, 1.9, 0.2],    r: 12.5, th: 0.14,  ph: 1.1,  hw: 3.2 },
      meta:     { t: [3.9, 1.9, -1.4],   r: 12,   th: 0.12,  ph: 1.12, hw: 3.0 },
      ambiente: { t: [-6.4, 2.0, -0.8],  r: 12,   th: -0.18, ph: 1.16, hw: 3.0 },
    };

    const cam = { th: 0, ph: 1.1, r: 16, tx: 0, ty: 0.9, tz: 0.2 };
    const goal = { th: 0, ph: 1.1, r: 16, tx: 0, ty: 0.9, tz: 0.2 };
    let viewName = "geral";

    function fitRadius(halfWidth) {                                            // distância para caber "halfWidth" na largura da tela
      const tanV = Math.tan((camera.fov * Math.PI) / 360);
      return clamp(halfWidth / (tanV * camera.aspect), 7, 42);
    }
    function setView(name, instant) {
      const v = VIEWS[name];
      if (!v) return;
      viewName = name;
      goal.th = v.th; goal.ph = v.ph;
      goal.tx = v.t[0]; goal.ty = v.t[1]; goal.tz = v.t[2];
      goal.r = Math.max(v.r, fitRadius(v.hw));
      if (instant || REDUCED) Object.assign(cam, goal);
      updateChips();
    }

    const camTarget = new THREE.Vector3();
    function applyCamera(dt) {
      const k = REDUCED ? 1 : 1 - Math.exp(-dt * 7);
      ["th", "ph", "r", "tx", "ty", "tz"].forEach((p) => { cam[p] += (goal[p] - cam[p]) * k; });
      const sp = Math.sin(cam.ph);
      camTarget.set(cam.tx, cam.ty, cam.tz);
      camera.position.set(cam.tx + cam.r * sp * Math.sin(cam.th), cam.ty + cam.r * Math.cos(cam.ph), cam.tz + cam.r * sp * Math.cos(cam.th));
      camera.lookAt(camTarget);
    }

    // ------------------------------------------------------------------ interação: arrastar / roda / pinça / clique na tampa
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function overLid(clientX, clientY) {
      if (!lidP) return false;
      const rc = canvas.getBoundingClientRect();
      ndc.set(((clientX - rc.left) / rc.width) * 2 - 1, -((clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObjects(lidP.pickables, false).length > 0;
    }
    const hint = $("stage-hint");
    function interacted() { if (hint) hint.classList.add("gone"); }

    const ptrs = new Map();
    let down = null, pinch = 0, lastHover = 0;
    const pinchDist = () => {
      const p = Array.from(ptrs.values());
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
    };
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (e) => {
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { down = { moved: 0, t: performance.now() }; canvas.classList.add("dragging"); }
      else if (ptrs.size === 2) { pinch = pinchDist(); down = null; }
      interacted();
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) {                                                                // mouse passando por cima: destaca a tampa
        const now = performance.now();
        if (e.pointerType === "mouse" && now - lastHover > 60) {
          lastHover = now;
          canvas.classList.toggle("hover", overLid(e.clientX, e.clientY));
        }
        return;
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) {
        if (down) down.moved += Math.abs(dx) + Math.abs(dy);
        goal.th = clamp(goal.th - dx * 0.0062, -1.75, 1.75);
        goal.ph = clamp(goal.ph - dy * 0.0052, 0.35, 1.45);
        viewName = null; updateChips();
      } else if (ptrs.size === 2 && pinch) {
        const d = pinchDist();
        goal.r = clamp(goal.r * (pinch / d), 4.5, 36);
        pinch = d; viewName = null; updateChips();
      }
    });
    function endPointer(e) {
      if (!ptrs.has(e.pointerId)) return;
      if (ptrs.size === 1 && down && e.type === "pointerup" && down.moved < 6 && performance.now() - down.t < 500 && overLid(e.clientX, e.clientY)) {
        App.commands.toggleLid();                                              // clique na tampa = abre/fecha
      }
      ptrs.delete(e.pointerId);
      pinch = 0; down = null;
      if (!ptrs.size) canvas.classList.remove("dragging");
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", () => canvas.classList.remove("hover"));
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      goal.r = clamp(goal.r * Math.exp(e.deltaY * 0.0012), 4.5, 36);
      viewName = null; updateChips(); interacted();
    }, { passive: false });
    canvas.addEventListener("dblclick", () => setView("geral"));
    stage.addEventListener("keydown", (e) => {                                 // acessibilidade: setas giram, +/- aproximam
      if (e.target !== stage) return;
      const m = { ArrowLeft: ["th", 0.12], ArrowRight: ["th", -0.12], ArrowUp: ["ph", -0.08], ArrowDown: ["ph", 0.08] }[e.key];
      if (m) { goal[m[0]] += m[1]; goal.ph = clamp(goal.ph, 0.35, 1.45); viewName = null; e.preventDefault(); }
      else if (e.key === "+" || e.key === "=") goal.r = clamp(goal.r * 0.88, 4.5, 36);
      else if (e.key === "-") goal.r = clamp(goal.r / 0.88, 4.5, 36);
      else if (e.key === "0") setView("geral");
      else return;
      updateChips(); interacted();
    });

    // ------------------------------------------------------------------ interface sobre a cena (rótulos, avisos, botões)
    const NOMES = ["Arroz", "Frango", "Ovo"];
    const EMOJI = ["🍚", "🍗", "🥚"];
    const tag = { plate: $("tag-plate"), station: $("tag-station"), jar: $("tag-jar"), lid: $("tag-lid") };
    const v3 = new THREE.Vector3();
    function place(el, x, y, z, show) {                                        // projeta um ponto 3D na tela e move o rótulo até lá
      v3.set(x, y, z).project(camera);
      const W = stage.clientWidth, H = stage.clientHeight;
      const ok = v3.z < 1 && Math.abs(v3.x) < 1.3 && Math.abs(v3.y) < 1.3;
      const meia = (el._w || 120) / 2 + 8;
      const px = clamp((v3.x * 0.5 + 0.5) * W, meia, W - meia);               // o rótulo nunca é cortado pela borda
      const py = Math.max((-v3.y * 0.5 + 0.5) * H, (el._h || 60) + 62);        // nem fica por baixo dos avisos do topo
      el.style.transform = "translate3d(" + px.toFixed(1) + "px," + py.toFixed(1) + "px,0) translate(-50%,-100%)";
      el.classList.toggle("show", !!show && ok);
    }
    function setText(el, txt) { if (el && el._t !== txt) { el._t = txt; el.textContent = txt; } }
    function levelOf(temp, lim) { return temp > lim ? "danger" : temp > lim - 3 ? "warn" : "ok"; }

    const foodChips = Array.from(stage.querySelectorAll("#stage-food button"));
    const camChips = Array.from(stage.querySelectorAll("#stage-cam button[data-view]"));
    function updateChips() {
      foodChips.forEach((b) => {
        const on = Number(b.dataset.food) === S.alimento;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      camChips.forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));
    }
    foodChips.forEach((b) => b.addEventListener("click", () => App.commands.setFood(Number(b.dataset.food))));
    camChips.forEach((b) => b.addEventListener("click", () => { setView(b.dataset.view); interacted(); }));
    if (tag.lid) tag.lid.addEventListener("click", () => App.commands.toggleLid());
    const btnFull = $("btn-full");
    if (btnFull) {
      if (!stage.requestFullscreen) btnFull.hidden = true;
      else btnFull.addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen(); });
    }

    // ------------------------------------------------------------------ estado animado da cena
    let plateOn = false, plateT = 0, dispPeso = 0, lastPortion = 300;
    let lidK = 0, lidV = 0, jarK = 0, tempK = 24, humK = 50, alarmK = 0, heat = 0;
    let landT = 9, atEnd = 0, lastPlateT = 0;
    const isLive = () => {
      if (S.mode === "demo") return true;
      if (S.broker !== "conectado" || S.device !== "online") return false;
      return S.lastData !== null && Date.now() - S.lastData < 12000;           // sem dados há 12 s = não está ao vivo
    };

    function update(dt, t) {
      const live = isLive();
      const peso = S.peso == null ? 0 : S.peso;
      const tipo = S.alimento == null ? 0 : clamp(S.alimento, 0, 2);
      const limT = S.limTemp == null ? LIM.temp : S.limTemp;

      // --- prato: vai para a balança quando há peso (histerese 10 g / 5 g, igual ao firmware)
      if (!plateOn && peso > 10) plateOn = true;
      else if (plateOn && peso < 5) plateOn = false;
      const alvo = plateOn ? 1 : 0;
      const dur = plateOn ? 1.25 : 1.0;
      plateT = REDUCED ? alvo : plateT + clamp(alvo - plateT, -dt / dur, dt / dur);
      const e = easeInOut(plateT);
      const arco = Math.sin(Math.PI * e) * 2.4;
      plate.position.set(lerp(REST.x, SC.x, e), lerp(REST.y, SC.topY, e) + arco, lerp(REST.z, SC.z, e));
      plate.rotation.z = -Math.sin(Math.PI * e) * 0.16;
      plate.rotation.x = Math.sin(Math.PI * e) * 0.07;
      if ((plateT >= 1 && lastPlateT < 1) || (plateT <= 0 && lastPlateT > 0)) landT = 0;      // pousou: pequena "acomodada"
      lastPlateT = plateT;
      landT += dt;
      const sq = Math.exp(-7 * landT) * Math.sin(landT * 20) * 0.05;
      plate.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
      if (plateOn) lastPortion = peso;
      updateFoods(tipo, plateOn ? peso : plateT > 0.02 ? lastPortion : PORCAO_PADRAO[tipo], dt);

      // --- visor da balança: o número "corre" até o valor novo
      dispPeso = damp(dispPeso, peso, REDUCED ? 60 : 7, dt);
      const alarmOn = live && S.alarme === 1;
      if (scaleP) scaleP.drawLcd(S.peso == null ? "---" : App.fmt(dispPeso, 1), "g", S.peso == null && !live ? "off" : alarmOn ? "alarm" : "ok");

      // --- alarme: LED pulsa, ondas saem do buzzer, luz vermelha no ambiente
      alarmK = damp(alarmK, alarmOn ? 1 : 0, 8, dt);
      const pulso = 0.5 + 0.5 * Math.sin(t * 9);
      if (scaleP) scaleP.ledMat.emissiveIntensity = 0.15 + 1.5 * alarmK * (0.35 + 0.65 * pulso);
      alarmLight.intensity = alarmK * (0.6 + 0.8 * pulso);
      if (rings) {
        rings.forEach((m, i) => {
          const fase = (t * 0.85 + i / 3) % 1;
          m.visible = alarmK > 0.03 && !REDUCED;
          m.scale.setScalar(1 + fase * 6.5);
          m.material.opacity = Math.pow(1 - fase, 1.6) * 0.6 * alarmK;
        });
      }

      // --- tampa (servo): mola levemente amortecida
      const lidAlvo = S.tampa === 1 ? 1 : 0;
      if (REDUCED) { lidK = lidAlvo; lidV = 0; }
      else { lidV += (lidAlvo - lidK) * 60 * dt; lidV *= Math.exp(-12 * dt); lidK += lidV * dt; }
      if (lidP) lidP.setOpen(clamp(lidK, -0.04, 1.04));

      // --- pote da meta e estação de temperatura/umidade
      const meta = S.meta || 2000;
      const frac = clamp((S.calDia || 0) / meta, 0, 1);
      jarK = damp(jarK, frac, 3, dt);
      if (jarP) jarP.apply(jarK, S.progresso == null ? frac * 100 : S.progresso, dt);
      tempK = damp(tempK, S.temp == null ? tempK : S.temp, 3, dt);
      humK = damp(humK, S.umid == null ? humK : S.umid, 3, dt);
      const nivel = S.temp == null ? "ok" : levelOf(S.temp, limT);
      if (stationP) { stationP.apply(tempK, humK, limT, nivel, dt); stationP.drawDisplay(S.temp, S.umid, nivel); }

      // --- luz do ambiente fica levemente mais quente quando passa do limite de temperatura
      heat = damp(heat, clamp(((S.temp == null ? 24 : S.temp) - (limT - 6)) / 10, 0, 1), 2, dt);
      sun.color.setRGB(1, 0.953 - 0.12 * heat, 0.878 - 0.3 * heat);
    }

    // ------------------------------------------------------------------ textos e avisos (10 vezes por segundo)
    function alarmeTexto() {
      const lp = App.fmt(S.limPeso == null ? LIM.peso : S.limPeso, 0), lt = App.fmt(S.limTemp == null ? LIM.temp : S.limTemp, 0);
      if (S.motivo === "porcao") return "Alarme: porção acima de " + lp + " g";
      if (S.motivo === "temperatura") return "Alarme: temperatura acima de " + lt + " °C";
      if (S.motivo === "porcao+temperatura") return "Alarme: porção acima de " + lp + " g e temperatura acima de " + lt + " °C";
      return "Alarme ativo";
    }
    function estadoTexto() {
      if (S.mode === "demo") return "";
      if (S.broker === "erro") return "Sem conexão com o broker MQTT. Use o modo demonstração para testar o 3D.";
      if (S.broker !== "conectado") return "Conectando ao broker MQTT…";
      if (S.device === "offline") return "Dispositivo offline: mostrando os últimos valores.";
      if (S.device === "desconhecido" || S.lastData === null) return "Aguardando o dispositivo. Inicie a simulação no Wokwi ou use o modo demonstração.";
      if (!isLive()) return "Sem dados recentes do dispositivo.";
      return "";
    }
    function updateHud() {
      const live = isLive();
      const tipo = S.alimento == null ? 0 : clamp(S.alimento, 0, 2);
      stage.classList.toggle("dim", !live);
      stage.classList.toggle("alarm", live && S.alarme === 1);
      const pillA = $("pill-alarm"), pillS = $("pill-state");
      if (pillA) { pillA.hidden = !(live && S.alarme === 1); setText($("pill-alarm-txt"), alarmeTexto()); }
      const et = estadoTexto();
      if (pillS) { pillS.hidden = !et; setText(pillS, et); }
      updateChips();

      // prato
      const naBalanca = plateT > 0.85;
      tag.plate.classList.toggle("resting", !naBalanca);
      setText($("tp-emoji"), EMOJI[tipo]);
      setText($("tp-nome"), NOMES[tipo]);
      setText($("tp-estado"), naBalanca ? "na balança" : plateOn ? "a caminho…" : "aguardando o prato");
      setText($("tp-peso"), S.peso == null ? "--" : App.fmt(dispPeso, 1));
      setText($("tp-kcal"), S.calRef == null ? "--" : App.fmt(S.calRef, 0));
      const pctRef = S.meta && S.calRef != null ? (S.calRef / S.meta) * 100 : null;
      setText($("tp-pct"), pctRef === null ? "" : " · " + App.fmt(pctRef, 0) + "% da meta");
      tag.plate.classList.toggle("danger", live && S.alarme === 1 && (S.motivo || "").indexOf("porcao") === 0);

      // estação
      const limT = S.limTemp == null ? LIM.temp : S.limTemp;
      setText($("ts-temp"), S.temp == null ? "--" : App.fmt(S.temp, 1));
      setText($("ts-umid"), S.umid == null ? "--" : App.fmt(S.umid, 0));
      tag.station.dataset.level = S.temp == null ? "ok" : levelOf(S.temp, limT);

      // pote
      const meta = S.meta || null;
      const pct = meta && S.calDia != null ? (S.calDia / meta) * 100 : null;
      setText($("tj-dia"), S.calDia == null ? "--" : App.fmt(S.calDia, 0));
      setText($("tj-meta"), meta === null ? "--" : App.fmt(meta, 0));
      const fill = $("tj-fill");
      if (fill) fill.style.width = (pct === null ? 0 : clamp(pct, 0, 100)).toFixed(1) + "%";
      tag.jar.dataset.level = pct === null ? "ok" : pct >= 100 ? "danger" : pct >= 80 ? "warn" : "ok";
      setText($("tj-note"), pct === null ? "meta do dia" : pct >= 100 ? "meta atingida" : App.fmt(pct, 0) + "% da meta do dia");

      // tampa
      const aberta = S.tampa === 1;
      setText($("tl-estado"), S.tampa == null ? "Tampa" : aberta ? "Tampa aberta" : "Tampa fechada");
      setText($("tl-acao"), aberta ? "clique para fechar" : "clique para abrir");
      Object.keys(tag).forEach((k) => { tag[k]._w = tag[k].offsetWidth; tag[k]._h = tag[k].offsetHeight; });   // tamanhos para o place()
    }
    function placeTags() {
      const hasPeso = S.peso != null || S.mode === "demo";
      // em tela estreita só aparecem as etiquetas do que está em foco (senão elas se sobrepõem)
      const so = stage.clientWidth < 600 && viewName === "balanca";
      place(tag.plate, plate.position.x, plate.position.y + 2.05, plate.position.z, hasPeso || plateT > 0);
      place(tag.station, ST.x, 4.2, ST.z, S.temp != null && !so);
      place(tag.jar, JR.x, 3.5, JR.z, (S.meta != null || S.calDia != null) && !so);
      place(tag.lid, CT.x, 2.2, CT.z, !so);
    }

    // ------------------------------------------------------------------ tamanho, visibilidade e laço principal
    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : 2));
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (viewName) setView(viewName, true);                                   // reenquadra a visão atual no novo tamanho
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", resize);

    let inView = true;
    if (window.IntersectionObserver) new IntersectionObserver((es) => { inView = es[0].isIntersecting; }).observe(stage);

    resize();
    setView(camera.aspect < 0.9 ? "balanca" : "geral", true);
    dispPeso = S.peso == null ? 0 : S.peso;
    if (S.peso != null && S.peso > 10) { plateOn = true; plateT = 1; lastPlateT = 1; }

    let last = performance.now(), hudAt = 0, errored = false;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!inView || document.hidden) return;                                  // não gasta bateria fora da tela
      try {
        update(dt, now / 1000);
        applyCamera(dt);
        renderer.render(scene, camera);
        placeTags();
        if (now - hudAt > 100) { hudAt = now; updateHud(); }
      } catch (err) {
        if (!errored) { errored = true; console.error("[3D] erro no laço de animação:", err); }
      }
    }
    msgEl.hidden = true;
    stage.classList.add("ready");
    updateHud();
    requestAnimationFrame(frame);

    window.Twin3D = { setView: setView, resize: resize, camera: camera, scene: scene };   // úteis para depurar no console
  }
})();
