import { useCallback, useEffect, useRef, useState } from 'react';
import Paho from 'paho-mqtt';
import { BASE_TOPIC, BROKER } from './config';
import { horaAgora } from './format';

const MAX_HISTORICO = 40;   // pontos guardados nos gráficos
const MAX_LOG = 30;         // linhas do monitor MQTT
const RECONECTAR_EM_MS = 3000;

const estadoInicial = {
  peso: null, calRefeicao: null, calDia: null, progresso: null,
  temperatura: null, umidade: null,
  alarme: null, motivo: null,
  tampa: null, alimento: null, meta: null,
  limitePeso: null, limiteTemp: null,
  dispositivo: 'desconhecido',       // desconhecido | online | offline
  ultimaTelemetria: null,            // Date.now() da última leitura AO VIVO
};

// "12,5" ou "12.5" -> 12.5 ; texto inválido -> null
function numero(texto) {
  const s = String(texto).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Conecta ao broker MQTT (via WebSocket), assina balanca-nutricional/<ID>/#
 * e mantém o estado do painel. `publicar` envia comandos para o ESP32.
 */
export function useBalancaMqtt() {
  const [conexao, setConexao] = useState('conectando'); // conectando | conectado | reconectando | erro
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(estadoInicial);
  const [historico, setHistorico] = useState({ peso: [], temperatura: [] });
  const [log, setLog] = useState([]);
  const clientRef = useRef(null);
  const contadorLog = useRef(0);

  const registrarLog = useCallback((dir, topico, payload, retido) => {
    contadorLog.current += 1;
    const curto = topico.startsWith(`${BASE_TOPIC}/`) ? topico.slice(BASE_TOPIC.length + 1) : topico;
    const linha = { id: contadorLog.current, hora: horaAgora(), dir, topico: curto, payload, retido };
    setLog((anterior) => [linha, ...anterior].slice(0, MAX_LOG));
  }, []);

  const limparLog = useCallback(() => setLog([]), []);

  useEffect(() => {
    let ativo = true;          // false depois que a tela é desmontada
    let assinado = false;      // já assinamos os tópicos nesta conexão?
    let temporizador = null;

    const atualizar = (patch) => setDados((anterior) => ({ ...anterior, ...patch }));

    const tratarMensagem = (topico, texto, retido) => {
      registrarLog('in', topico, texto, retido);
      if (!topico.startsWith(`${BASE_TOPIC}/`)) return;
      const chave = topico.slice(BASE_TOPIC.length + 1);
      const aoVivo = !retido;   // retain=true => valor antigo guardado pelo broker
      const n = numero(texto);

      switch (chave) {
        case 'peso':
          if (n === null) return;
          atualizar(aoVivo ? { peso: n, ultimaTelemetria: Date.now() } : { peso: n });
          if (aoVivo) setHistorico((h) => ({ ...h, peso: [...h.peso, n].slice(-MAX_HISTORICO) }));
          break;
        case 'calorias/refeicao': if (n !== null) atualizar({ calRefeicao: n }); break;
        case 'calorias/dia':      if (n !== null) atualizar({ calDia: n }); break;
        case 'meta/progresso':    if (n !== null) atualizar({ progresso: n }); break;
        case 'ambiente/temperatura':
          if (n === null) return;
          atualizar({ temperatura: n });
          if (aoVivo) setHistorico((h) => ({ ...h, temperatura: [...h.temperatura, n].slice(-MAX_HISTORICO) }));
          break;
        case 'ambiente/umidade':  if (n !== null) atualizar({ umidade: n }); break;
        case 'alarme/status':     if (n !== null) atualizar({ alarme: n === 1 ? 1 : 0 }); break;
        case 'alarme/motivo':     atualizar({ motivo: texto }); break;
        case 'tampa/estado':      if (n !== null) atualizar({ tampa: n === 1 ? 1 : 0 }); break;
        case 'config/alimento':   if (n !== null && n >= 0 && n <= 2) atualizar({ alimento: n }); break;
        case 'config/meta':       if (n !== null) atualizar({ meta: n }); break;
        case 'config/limite_peso':        if (n !== null) atualizar({ limitePeso: n }); break;
        case 'config/limite_temperatura': if (n !== null) atualizar({ limiteTemp: n }); break;
        case 'status':            atualizar({ dispositivo: texto === 'online' ? 'online' : 'offline' }); break;
        default: break;           // inclui cmd/* (eco dos nossos comandos)
      }
    };

    const clientId = `mobile-${Math.random().toString(16).slice(2, 10)}`;
    const client = new Paho.Client(BROKER.host, BROKER.port, BROKER.path, clientId);
    clientRef.current = client;

    const garantirAssinatura = () => {
      if (assinado) return;
      assinado = true;
      client.subscribe(`${BASE_TOPIC}/#`, { qos: 0 });
    };

    const agendarReconexao = () => {
      if (!ativo) return;
      clearTimeout(temporizador);
      temporizador = setTimeout(conectar, RECONECTAR_EM_MS);
    };

    const aoConectar = () => {
      if (!ativo) return;
      setConexao('conectado');
      setErro('');
      garantirAssinatura();
    };

    client.onConnected = aoConectar;
    client.onConnectionLost = () => {
      assinado = false;
      if (!ativo) return;
      setConexao('reconectando');
      atualizar({ dispositivo: 'desconhecido' });   // sem broker não dá pra saber
      agendarReconexao();
    };
    client.onMessageArrived = (msg) => {
      if (!ativo) return;
      tratarMensagem(msg.destinationName, msg.payloadString, !!msg.retained);
    };

    function conectar() {
      if (!ativo) return;
      try {
        client.connect({
          useSSL: BROKER.ssl,
          timeout: 10,
          keepAliveInterval: 30,
          cleanSession: true,
          onSuccess: aoConectar,
          onFailure: (e) => {
            if (!ativo) return;
            setConexao('erro');
            setErro((e && e.errorMessage) || 'falha ao conectar');
            agendarReconexao();
          },
        });
      } catch (e) {
        setConexao('erro');
        setErro(String((e && e.message) || e));
        agendarReconexao();
      }
    }

    conectar();

    return () => {
      ativo = false;
      clearTimeout(temporizador);
      try { client.disconnect(); } catch (e) { /* já estava desconectado */ }
    };
  }, [registrarLog]);

  // Envia um comando para o ESP32: balanca-nutricional/<ID>/cmd/<sub>
  const publicar = useCallback((sub, valor, retido) => {
    const client = clientRef.current;
    if (!client || !client.isConnected()) return false;
    const mensagem = new Paho.Message(String(valor));
    mensagem.destinationName = `${BASE_TOPIC}/cmd/${sub}`;
    mensagem.qos = 0;
    mensagem.retained = !!retido;
    client.send(mensagem);
    registrarLog('out', mensagem.destinationName, String(valor), !!retido);
    return true;
  }, [registrarLog]);

  return { conexao, erro, dados, historico, log, publicar, limparLog };
}
