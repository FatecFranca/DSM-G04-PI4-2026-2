import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBalancaMqtt } from '../balanca/useBalancaMqtt';
import { Barra, Botao, Cartao, Grafico, Pilula, Segmentado } from '../balanca/ui';
import { useTema } from '../balanca/theme';
import { fmt, relativo } from '../balanca/format';
import { ALIMENTOS, COMANDOS, TEXTO_TAMPA } from '../balanca/config';

const ROTULO_CONEXAO = {
  conectando: 'Conectando ao broker…',
  conectado: 'Broker conectado',
  reconectando: 'Reconectando…',
  erro: 'Erro de conexão',
};

// Fração (0 a 1) da meta diária de calorias já consumida.
function fracaoDaMeta(d) {
  if (d.meta && d.calDia !== null) return d.calDia / d.meta;
  if (d.progresso !== null) return d.progresso > 1 ? d.progresso / 100 : d.progresso;
  return 0;
}

export default function BalancaScreen({ navigation }) {
  const t = useTema();
  const insets = useSafeAreaInsets();
  const { conexao, erro, dados, historico, log, publicar, limparLog } = useBalancaMqtt();

  // Atualiza o "há X s" uma vez por segundo.
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const corConexao =
    conexao === 'conectado' ? t.ok : conexao === 'erro' ? t.perigo : t.aviso;

  const corDispositivo =
    dados.dispositivo === 'online' ? t.ok : dados.dispositivo === 'offline' ? t.perigo : t.aviso;

  const rotuloDispositivo =
    dados.dispositivo === 'online'
      ? 'Balança online'
      : dados.dispositivo === 'offline'
        ? 'Balança offline'
        : 'Balança: aguardando';

  const fracao = fracaoDaMeta(dados);
  const corProgresso = fracao > 1 ? t.perigo : fracao > 0.85 ? t.aviso : t.primaria;

  function enviar(sub, valor) {
    if (!publicar(sub, valor)) {
      Alert.alert('Sem conexão', 'Aguarde a conexão com o broker para enviar comandos.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fundo }}>
      <View style={[s.cabecalho, { backgroundColor: t.cabecalho, paddingTop: insets.top + 12 }]}>
        <Text style={s.titulo}>Balança Inteligente</Text>
        <View style={s.pilulas}>
          <Pilula rotulo={ROTULO_CONEXAO[conexao]} cor={corConexao} />
          <Pilula rotulo={rotuloDispositivo} cor={corDispositivo} />
        </View>
        {conexao === 'erro' && !!erro && <Text style={s.erro}>{erro}</Text>}
      </View>

      <ScrollView contentContainerStyle={s.conteudo}>
        {dados.alarme === 1 && (
          <View style={[s.alarme, { backgroundColor: t.perigoSuave, borderColor: t.perigo }]}>
            <Text style={[s.alarmeTitulo, { color: t.perigo }]}>Alarme ativo</Text>
            {!!dados.motivo && <Text style={{ color: t.texto }}>{dados.motivo}</Text>}
          </View>
        )}

        <Cartao titulo="Peso do alimento">
          <Text style={[s.grande, { color: t.texto }]}>
            {fmt(dados.peso, 1)} <Text style={[s.unidade, { color: t.mudo }]}>g</Text>
          </Text>
          <Text style={{ color: t.mudo, fontSize: 12 }}>
            {dados.ultimaTelemetria
              ? `Última leitura ao vivo: ${relativo(agora - dados.ultimaTelemetria)}`
              : dados.peso !== null
                ? 'Valor guardado no broker (sem leitura ao vivo)'
                : 'Aguardando a balança'}
          </Text>
          <Grafico dados={historico.peso} cor={t.primaria} />
        </Cartao>

        <Cartao titulo="Calorias">
          <View style={s.linha}>
            <Metrica rotulo="Refeição" valor={fmt(dados.calRefeicao, 0)} unidade="kcal" />
            <Metrica rotulo="No dia" valor={fmt(dados.calDia, 0)} unidade="kcal" />
            <Metrica rotulo="Meta" valor={fmt(dados.meta, 0)} unidade="kcal" />
          </View>
          <Barra fracao={fracao} cor={corProgresso} marcador={1} />
          <Text style={{ color: t.mudo, fontSize: 12 }}>
            {Math.round(fracao * 100)}% da meta diária
          </Text>
        </Cartao>

        <Cartao titulo="Ambiente">
          <View style={s.linha}>
            <Metrica rotulo="Temperatura" valor={fmt(dados.temperatura, 1)} unidade="°C" />
            <Metrica rotulo="Umidade" valor={fmt(dados.umidade, 0)} unidade="%" />
            <Metrica
              rotulo="Tampa"
              valor={dados.tampa === null ? '--' : TEXTO_TAMPA[dados.tampa]}
            />
          </View>
          <Grafico dados={historico.temperatura} cor={t.aviso} />
          <Text style={{ color: t.mudo, fontSize: 12 }}>
            Limites: peso {fmt(dados.limitePeso, 0)} g · temperatura {fmt(dados.limiteTemp, 0)} °C
          </Text>
        </Cartao>

        <Cartao titulo="Controles">
          <Text style={{ color: t.texto, fontWeight: '600' }}>Alimento sendo pesado</Text>
          <Segmentado
            opcoes={ALIMENTOS}
            valor={dados.alimento}
            onChange={(v) => enviar(COMANDOS.alimento, v)}
          />
          <Botao rotulo="Zerar balança (tara)" onPress={() => enviar(COMANDOS.tara, 1)} />
        </Cartao>

        <Cartao titulo="Dashboard alimentar">
          <Text style={{ color: t.mudo, fontSize: 12 }}>
            Indicadores, gráficos e análises estatísticas de consumo (dados demonstrativos).
          </Text>
          <Botao rotulo="Abrir dashboard" variante="primario" onPress={() => navigation.navigate('Dashboard')} />
        </Cartao>

        <Cartao titulo="Monitor MQTT">
          {log.length === 0 ? (
            <Text style={{ color: t.mudo, fontSize: 12 }}>Nenhuma mensagem ainda.</Text>
          ) : (
            log.slice(0, 12).map((l) => (
              <Text key={l.id} style={[s.logLinha, { color: t.texto }]} numberOfLines={1}>
                <Text style={{ color: t.mudo }}>
                  {l.hora} {l.dir === 'in' ? '←' : '→'}{' '}
                </Text>
                {l.topico}: {l.payload}
                {l.retido ? ' (retido)' : ''}
              </Text>
            ))
          )}
          <Botao rotulo="Limpar monitor" onPress={limparLog} />
        </Cartao>
      </ScrollView>
    </View>
  );
}

function Metrica({ rotulo, valor, unidade }) {
  const t = useTema();
  return (
    <View style={s.metrica}>
      <Text style={{ color: t.mudo, fontSize: 11 }}>{rotulo}</Text>
      <Text style={{ color: t.texto, fontSize: 20, fontWeight: '800' }}>
        {valor}
        {unidade ? <Text style={{ color: t.mudo, fontSize: 12 }}> {unidade}</Text> : null}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  cabecalho: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  erro: { color: '#fecaca', fontSize: 12 },
  conteudo: { padding: 16, gap: 14, paddingBottom: 40 },
  alarme: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  alarmeTitulo: { fontWeight: '800', fontSize: 15 },
  grande: { fontSize: 40, fontWeight: '800' },
  unidade: { fontSize: 18, fontWeight: '600' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  metrica: { flex: 1, gap: 2 },
  logLinha: { fontSize: 11, fontFamily: 'monospace' },
});
