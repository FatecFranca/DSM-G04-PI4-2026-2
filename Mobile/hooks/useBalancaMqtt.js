import { useCallback, useEffect, useRef, useState } from 'react';
import Paho from 'paho-mqtt';

import { BASE_TOPIC, BROKER } from '../config';
import { horaAgora } from '../utils/format';

const MAX_HISTORICO = 40;
const MAX_LOG = 30;
const RECONECTAR_EM_MS = 3000;

const estadoInicial = {
  peso: null,
  calRefeicao: null,
  calDia: null,
  progresso: null,
  temperatura: null,
  umidade: null,
  alarme: null,
  motivo: null,
  tampa: null,
  alimento: null,
  meta: null,
  limitePeso: null,
  limiteTemp: null,
  dispositivo: 'desconhecido',
  ultimaTelemetria: null,
};

function numero(texto) {
  const n = Number(String(texto).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function useBalancaMqtt() {
  const [conexao, setConexao] = useState('conectando');
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(estadoInicial);
  const [historico, setHistorico] = useState({
    peso: [],
    temperatura: [],
  });
  const [log, setLog] = useState([]);

  const clientRef = useRef(null);
  const contadorLog = useRef(0);

  const registrarLog = useCallback((dir, topico, payload, retido) => {
    contadorLog.current++;

    const curto = topico.startsWith(`${BASE_TOPIC}/`)
      ? topico.slice(BASE_TOPIC.length + 1)
      : topico;

    const linha = {
      id: contadorLog.current,
      hora: horaAgora(),
      dir,
      topico: curto,
      payload,
      retido,
    };

    setLog(anterior => [linha, ...anterior].slice(0, MAX_LOG));
  }, []);

  const limparLog = useCallback(() => setLog([]), []);

  useEffect(() => {
    let ativo = true;
    let assinado = false;
    let temporizador = null;

    const atualizar = patch => {
      setDados(anterior => ({ ...anterior, ...patch }));
    };

    const tratarMensagem = (topico, texto, retido) => {
      registrarLog('in', topico, texto, retido);

      if (!topico.startsWith(`${BASE_TOPIC}/`)) return;

      const chave = topico.slice(BASE_TOPIC.length + 1);
      const aoVivo = !retido;
      const n = numero(texto);

      switch (chave) {
        case 'peso':
          if (n === null) return;

          atualizar(
            aoVivo
              ? { peso: n, ultimaTelemetria: Date.now() }
              : { peso: n }
          );

          if (aoVivo) {
            setHistorico(h => ({
              ...h,
              peso: [...h.peso, n].slice(-MAX_HISTORICO),
            }));
          }
          break;

        case 'calorias/refeicao':
          if (n !== null) atualizar({ calRefeicao: n });
          break;

        case 'calorias/dia':
          if (n !== null) atualizar({ calDia: n });
          break;

        case 'meta/progresso':
          if (n !== null) atualizar({ progresso: n });
          break;

        case 'ambiente/temperatura':
          if (n === null) return;

          atualizar({ temperatura: n });

          if (aoVivo) {
            setHistorico(h => ({
              ...h,
              temperatura: [...h.temperatura, n].slice(-MAX_HISTORICO),
            }));
          }
          break;

        case 'ambiente/umidade':
          if (n !== null) atualizar({ umidade: n });
          break;

        case 'alarme/status':
          if (n !== null) atualizar({ alarme: n === 1 ? 1 : 0 });
          break;

        case 'alarme/motivo':
          atualizar({ motivo: texto });
          break;

        case 'tampa/estado':
          if (n !== null) atualizar({ tampa: n === 1 ? 1 : 0 });
          break;

        case 'config/alimento':
          if (n !== null && n >= 0 && n <= 2) {
            atualizar({ alimento: n });
          }
          break;

        case 'config/meta':
          if (n !== null) atualizar({ meta: n });
          break;

        case 'config/limite_peso':
          if (n !== null) atualizar({ limitePeso: n });
          break;

        case 'config/limite_temperatura':
          if (n !== null) atualizar({ limiteTemp: n });
          break;

        case 'status':
          atualizar({
            dispositivo: texto === 'online' ? 'online' : 'offline',
          });
          break;

        default:
          break;
      }
    };

    const clientId = `mobile-${Math.random().toString(16).slice(2, 10)}`;

    const client = new Paho.Client(
      BROKER.host,
      BROKER.port,
      BROKER.path,
      clientId
    );

    clientRef.current = client;

    const conectar = () => {
      if (!ativo) return;

      try {
        client.connect({
          useSSL: BROKER.ssl,
          timeout: 10,
          keepAliveInterval: 30,
          cleanSession: true,

          onSuccess: () => {
            if (!ativo) return;

            setConexao('conectado');
            setErro('');

            if (!assinado) {
              client.subscribe(`${BASE_TOPIC}/#`, { qos: 0 });
              assinado = true;
            }
          },

          onFailure: e => {
            if (!ativo) return;

            setConexao('erro');
            setErro(e?.errorMessage || 'Falha ao conectar');

            temporizador = setTimeout(conectar, RECONECTAR_EM_MS);
          },
        });
      } catch (e) {
        setConexao('erro');
        setErro(e.message || 'Erro MQTT');

        temporizador = setTimeout(conectar, RECONECTAR_EM_MS);
      }
    };

    client.onConnectionLost = () => {
      assinado = false;

      if (!ativo) return;

      setConexao('reconectando');
      atualizar({ dispositivo: 'desconhecido' });

      clearTimeout(temporizador);
      temporizador = setTimeout(conectar, RECONECTAR_EM_MS);
    };

    client.onMessageArrived = msg => {
      if (!ativo) return;

      tratarMensagem(
        msg.destinationName,
        msg.payloadString,
        !!msg.retained
      );
    };

    conectar();

    return () => {
      ativo = false;
      clearTimeout(temporizador);

      try {
        client.disconnect();
      } catch (e) {
        // Cliente já desconectado.
      }

      clientRef.current = null;
    };
  }, [registrarLog]);

  const publicar = useCallback((sub, valor, retido = false) => {
    const client = clientRef.current;

    if (!client || !client.isConnected()) {
      return false;
    }

    const mensagem = new Paho.Message(String(valor));

    mensagem.destinationName = `${BASE_TOPIC}/cmd/${sub}`;
    mensagem.qos = 0;
    mensagem.retained = !!retido;

    client.send(mensagem);

    registrarLog(
      'out',
      mensagem.destinationName,
      String(valor),
      !!retido
    );

    return true;
  }, [registrarLog]);

  return {
    conexao,
    erro,
    dados,
    historico,
    log,
    publicar,
    limparLog,
  };
}