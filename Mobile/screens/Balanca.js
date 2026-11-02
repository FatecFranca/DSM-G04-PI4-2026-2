
import React, { useState } from 'react';

import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useBalancaMqtt } from '../hooks/useBalancaMqtt';
import { useTema } from '../theme/theme';
import { fmt, relativo } from '../utils/format';

import {
  Barra,
  Botao,
  Cartao,
  Grafico,
  Pilula,
  Segmentado,
} from '../components/ui';

const ALIMENTOS = [
  { valor: 0, rotulo: 'Arroz' },
  { valor: 1, rotulo: 'Frango' },
  { valor: 2, rotulo: 'Ovo' },
];

export default function BalancaScreen() {
  const t = useTema();

  const {
    conexao,
    erro,
    dados,
    historico,
    log,
    publicar,
    limparLog,
  } = useBalancaMqtt();

  const [metaTexto, setMetaTexto] = useState('');
  const [verLog, setVerLog] = useState(false);

  const enviar = (sub, valor, retido = true) => {
    const sucesso = publicar(sub, valor, retido);

    if (!sucesso) {
      Alert.alert(
        'Sem conexão',
        'O broker MQTT não está conectado. Tente novamente.'
      );
      return false;
    }

    return true;
  };

  const escolherAlimento = valor => {
    enviar('alimento', valor);
  };

  const alternarTampa = () => {
    const abrir = dados.tampa !== 1;
    enviar('tampa', abrir ? 1 : 0);
  };

  const aplicarMeta = () => {
    const valor = Number(metaTexto.replace(',', '.'));

    if (!Number.isFinite(valor) || valor < 100 || valor > 10000) {
      Alert.alert(
        'Meta inválida',
        'Informe um valor entre 100 e 10000 kcal.'
      );
      return;
    }

    if (enviar('meta', Math.round(valor))) {
      setMetaTexto('');
    }
  };

  const zerarDia = () => {
    Alert.alert(
      'Zerar calorias?',
      'Deseja realmente zerar o total de calorias do dia?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Zerar',
          style: 'destructive',
          onPress: () => enviar('resetar', 1, false),
        },
      ]
    );
  };

  const percentual =
    dados.progresso !== null
      ? dados.progresso
      : dados.meta && dados.calDia !== null
        ? (dados.calDia / dados.meta) * 100
        : null;

  const alarmeAtivo = dados.alarme === 1;

  const corConexao =
    conexao === 'conectado'
      ? '#16A34A'
      : conexao === 'erro'
        ? '#DC2626'
        : '#D97706';

  const corDispositivo =
    dados.dispositivo === 'online'
      ? '#16A34A'
      : dados.dispositivo === 'offline'
        ? '#DC2626'
        : '#D97706';

  return (
    <View style={[styles.tela, { backgroundColor: t.fundo }]}>

      <View style={[styles.cabecalho, { backgroundColor: t.cabecalho }]}>

        <Text style={styles.titulo}>
          Balança Nutricional
        </Text>

        <Text style={styles.subtitulo}>
          Monitoramento IoT
        </Text>

        <View style={styles.statusContainer}>
          <Pilula
            rotulo={`Broker: ${conexao}`}
            cor={corConexao}
          />

          <Pilula
            rotulo={`Dispositivo: ${dados.dispositivo}`}
            cor={corDispositivo}
          />
        </View>

        {erro ? (
          <Text style={styles.erro}>
            {erro}
          </Text>
        ) : null}

        {dados.ultimaTelemetria ? (
          <Text style={styles.ultimaLeitura}>
            Última leitura: {relativo(Date.now() - dados.ultimaTelemetria)}
          </Text>
        ) : null}

      </View>

      {conexao === 'conectando' ? (
        <View style={styles.carregando}>
          <ActivityIndicator size="large" color={t.primaria} />

          <Text style={{ color: t.mudo }}>
            Conectando ao broker MQTT...
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >

        {/* PESO */}

        <Cartao titulo="Peso no prato">

          <Text style={[styles.valorGrande, { color: t.texto }]}>
            {fmt(dados.peso, 1)} g
          </Text>

          <Text style={{ color: t.mudo }}>
            Limite de porção: {fmt(dados.limitePeso)} g
          </Text>

          {dados.limitePeso !== null ? (
            <Barra
              fracao={dados.peso / Math.max(dados.limitePeso, 1)}
              cor={t.primaria}
            />
          ) : null}

        </Cartao>

        {/* CALORIAS */}

        <Cartao titulo="Calorias">

          <View style={styles.linha}>

            <View style={styles.coluna}>
              <Text style={{ color: t.mudo }}>
                No prato
              </Text>

              <Text style={[styles.valor, { color: t.texto }]}>
                {fmt(dados.calRefeicao)} kcal
              </Text>
            </View>

            <View style={styles.coluna}>
              <Text style={{ color: t.mudo }}>
                Total do dia
              </Text>

              <Text style={[styles.valor, { color: t.texto }]}>
                {fmt(dados.calDia)} kcal
              </Text>
            </View>

          </View>

          <Text style={{ color: t.mudo }}>
            Meta diária: {fmt(dados.meta)} kcal
          </Text>

          <Text style={[styles.valor, { color: t.texto }]}>
            {percentual === null
              ? '--'
              : `${fmt(percentual, 1)}%`}
          </Text>

          {percentual !== null ? (
            <Barra
              fracao={percentual / 100}
              cor={t.ok}
            />
          ) : null}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: t.cartao2,
                color: t.texto,
                borderColor: t.borda,
              },
            ]}
            placeholder="Nova meta em kcal"
            placeholderTextColor={t.mudo}
            keyboardType="numeric"
            value={metaTexto}
            onChangeText={setMetaTexto}
          />

          <Botao
            rotulo="Definir meta"
            variante="primario"
            onPress={aplicarMeta}
          />

          <Botao
            rotulo="Zerar calorias do dia"
            variante="perigo"
            onPress={zerarDia}
          />

        </Cartao>

        {/* ALIMENTO */}

        <Cartao titulo="Alimento no prato">

          <Text style={{ color: t.mudo }}>
            Selecione o alimento antes de colocar o prato na balança.
          </Text>

          <Segmentado
            opcoes={ALIMENTOS}
            valor={dados.alimento}
            onChange={escolherAlimento}
          />

        </Cartao>

        {/* TAMPA */}

        <Cartao titulo="Tampa do recipiente">

          <Text style={[styles.valor, { color: t.texto }]}>
            {dados.tampa === null
              ? 'Aguardando estado'
              : dados.tampa === 1
                ? 'Aberta'
                : 'Fechada'}
          </Text>

          <Botao
            rotulo={dados.tampa === 1 ? 'Fechar tampa' : 'Abrir tampa'}
            variante="primario"
            onPress={alternarTampa}
          />

        </Cartao>

        {/* AMBIENTE */}

        <Cartao titulo="Ambiente - DHT22">

          <Text style={{ color: t.mudo }}>
            Temperatura
          </Text>

          <Text style={[styles.valorGrande, { color: t.texto }]}>
            {fmt(dados.temperatura, 1)} °C
          </Text>

          <Text style={{ color: t.mudo }}>
            Limite: {fmt(dados.limiteTemp)} °C
          </Text>

          <View style={[styles.divisor, { backgroundColor: t.borda }]} />

          <Text style={{ color: t.mudo }}>
            Umidade
          </Text>

          <Text style={[styles.valorGrande, { color: t.texto }]}>
            {fmt(dados.umidade, 1)}%
          </Text>

        </Cartao>

        {/* ALARME */}

        <Cartao titulo="Alarme automático">

          <Text
            style={[
              styles.valor,
              {
                color:
                  dados.alarme === null
                    ? t.mudo
                    : alarmeAtivo
                      ? t.perigo
                      : t.ok,
              },
            ]}
          >
            {dados.alarme === null
              ? 'Aguardando dados'
              : alarmeAtivo
                ? 'ALARME ATIVO'
                : 'Tudo normal'}
          </Text>

          <Text style={{ color: t.mudo }}>
            {dados.motivo || 'Nenhuma condição de risco informada.'}
          </Text>

        </Cartao>

        {/* HISTÓRICO DE PESO */}

        <Cartao titulo="Histórico de peso">

          <Grafico
            dados={historico.peso}
            cor={t.primaria}
          />

          {historico.peso.length === 0 ? (
            <Text style={{ color: t.mudo }}>
              Nenhuma leitura recebida nesta sessão.
            </Text>
          ) : null}

          <Text style={{ color: t.mudo }}>
            Leituras recentes: {historico.peso.length}
          </Text>

        </Cartao>

        {/* HISTÓRICO DE TEMPERATURA */}

        <Cartao titulo="Histórico de temperatura">

          <Grafico
            dados={historico.temperatura}
            cor={t.aviso}
          />

          <Text style={{ color: t.mudo }}>
            Leituras recentes: {historico.temperatura.length}
          </Text>

        </Cartao>

        {/* MONITOR MQTT */}

        <Cartao titulo="Monitor MQTT">

          <Botao
            rotulo={
              verLog
                ? 'Ocultar mensagens'
                : `Mostrar mensagens (${log.length})`
            }
            onPress={() => setVerLog(!verLog)}
          />

          {verLog ? (
            <>
              {log.length === 0 ? (
                <Text style={{ color: t.mudo }}>
                  Nenhuma mensagem recebida.
                </Text>
              ) : (
                log.map(item => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemHistorico,
                      { borderBottomColor: t.borda },
                    ]}
                  >
                    <Text style={{ color: t.mudo, fontSize: 12 }}>
                      {item.hora} - {item.dir}
                    </Text>

                    <Text style={{ color: t.texto, fontWeight: '600' }}>
                      {item.topico}
                    </Text>

                    <Text style={{ color: t.mudo }}>
                      {item.payload}
                    </Text>
                  </View>
                ))
              )}

              <Botao
                rotulo="Limpar mensagens"
                variante="perigo"
                onPress={limparLog}
              />
            </>
          ) : null}

        </Cartao>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },

  cabecalho: {
    padding: 20,
    paddingTop: 24,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
  },

  subtitulo: {
    color: '#CBD5E1',
    marginTop: 5,
  },

  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },

  erro: {
    color: '#FCA5A5',
    marginTop: 10,
  },

  ultimaLeitura: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 10,
  },

  carregando: {
    alignItems: 'center',
    padding: 15,
    gap: 8,
  },

  conteudo: {
    padding: 15,
    paddingBottom: 35,
    gap: 12,
  },

  valorGrande: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  valor: {
    fontSize: 21,
    fontWeight: 'bold',
  },

  linha: {
    flexDirection: 'row',
    gap: 15,
  },

  coluna: {
    flex: 1,
    gap: 5,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },

  divisor: {
    height: 1,
  },

  itemHistorico: {
    borderBottomWidth: 1,
    paddingVertical: 9,
    gap: 4,
  },
});
