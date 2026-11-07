import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gerarRegistros } from '../data/dashboardData';
import {
  analisarRegistros,
  csvRegistros,
  numero,
  validarFiltros,
} from '../utils/dashboardAnalytics';
import {
  ConsumoDiarioChart,
  CorrelacaoChart,
  DistribuicaoNormalChart,
} from '../components/DashboardCharts';
import { useTema } from '../theme/theme';

const VERDE = '#15966A';
const ALIMENTOS = ['Todos', 'Arroz', 'Frango', 'Ovo'];
const PERIODO = [
  { rotulo: 'Tudo', dias: 0 },
  { rotulo: '7 dias', dias: 7 },
  { rotulo: '30 dias', dias: 30 },
  { rotulo: '90 dias', dias: 90 },
];

function retrocederDias(data, dias) {
  const utc = new Date(`${data}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() - dias + 1);
  return utc.toISOString().slice(0, 10);
}

function Indicador({ titulo, valor, t, destaque = VERDE }) {
  return (
    <View style={[styles.indicador, { backgroundColor: t.cartao, borderColor: t.borda }]}>
      <Text style={[styles.indicadorRotulo, { color: t.mudo }]}>{titulo}</Text>
      <Text style={[styles.indicadorValor, { color: destaque }]} numberOfLines={2} adjustsFontSizeToFit>
        {valor}
      </Text>
    </View>
  );
}

function Painel({ titulo, descricao, t, children }) {
  return (
    <View style={[styles.painel, { backgroundColor: t.cartao, borderColor: t.borda }]}>
      <Text style={[styles.painelTitulo, { color: t.texto }]}>{titulo}</Text>
      {descricao ? <Text style={[styles.painelDescricao, { color: t.mudo }]}>{descricao}</Text> : null}
      {children}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const t = useTema();
  const registros = useMemo(() => gerarRegistros(), []);
  const menorData = registros[0].data;
  const maiorData = registros[registros.length - 1].data;

  const [rascunho, setRascunho] = useState({
    alimento: 'Todos',
    inicio: menorData,
    fim: maiorData,
    metaTexto: '2000',
  });
  const [aplicados, setAplicados] = useState({
    alimento: 'Todos',
    inicio: menorData,
    fim: maiorData,
    meta: 2000,
  });
  const [periodoSelecionado, setPeriodoSelecionado] = useState('Tudo');
  const [exportando, setExportando] = useState(false);

  const analise = useMemo(
    () => analisarRegistros(registros, aplicados),
    [registros, aplicados]
  );

  const alterar = (chave, valor) => setRascunho(atual => ({ ...atual, [chave]: valor }));

  function aplicarFiltros(novoRascunho = rascunho) {
    const meta = Number(novoRascunho.metaTexto.replace(',', '.'));
    const filtro = {
      alimento: novoRascunho.alimento,
      inicio: novoRascunho.inicio.trim(),
      fim: novoRascunho.fim.trim(),
      meta,
    };
    const erro = validarFiltros(filtro);
    if (erro) {
      Alert.alert('Filtro inválido', erro);
      return;
    }
    setAplicados(filtro);
  }

  function selecionarPeriodo(opcao) {
    const novo = {
      ...rascunho,
      inicio: opcao.dias ? retrocederDias(maiorData, opcao.dias) : menorData,
      fim: maiorData,
    };
    setRascunho(novo);
    setPeriodoSelecionado(opcao.rotulo);
    aplicarFiltros(novo);
  }

  async function compartilharCSV() {
    if (!analise.quantidade || exportando) {
      if (!analise.quantidade) Alert.alert('Sem registros', 'Não há registros para compartilhar.');
      return;
    }
    // Share nativo compartilha texto CSV. Não finge anexar um arquivo .csv.
    // Para conjuntos muito grandes, o usuário pode restringir o período.
    if (analise.quantidade > 2500) {
      Alert.alert(
        'Exportação muito grande',
        'O compartilhamento de texto no celular aceita melhor arquivos menores. Filtre um período com até 2.500 registros e tente novamente.'
      );
      return;
    }
    setExportando(true);
    try {
      await Share.share({
        title: 'Registros SafeBite em CSV',
        message: csvRegistros(analise.registros),
      }, { dialogTitle: 'Compartilhar registros CSV' });
    } catch (erro) {
      Alert.alert('Erro ao compartilhar', 'Não foi possível abrir o compartilhamento de dados.');
    } finally {
      setExportando(false);
    }
  }

  const indicadores = [
    ['Registros', numero(analise.quantidade)],
    ['Calorias totais', `${numero(analise.total, 1)} kcal`],
    ['Média por prato', `${numero(analise.media, 1)} kcal`],
    ['Desvio padrão', `${numero(analise.desvio, 1)} kcal`],
    ['Alarmes (>300 kcal)', numero(analise.alarmes)],
    ['Percentual de alarmes', `${numero(analise.percentualAlarmes, 1)}%`],
    ['Temperatura média', `${numero(analise.temperatura, 1)} °C`],
    ['Umidade média', `${numero(analise.umidade, 1)}%`],
  ];

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: t.fundo }]} edges={['top', 'bottom']}>
      <View style={[styles.topo, { backgroundColor: t.cartao, borderBottomColor: t.borda }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.voltar}>
          <Text style={[styles.voltarTexto, { color: VERDE }]}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.topoTitulo, { color: t.texto }]}>Dashboard</Text>
        <View style={{ width: 62 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.banner}>
          <Text style={styles.bannerMarca}>● SafeBite</Text>
          <Text style={styles.bannerTitulo}>Dashboard alimentar</Text>
          <Text style={styles.bannerSubtitulo}>Consumo, indicadores e análises estatísticas.</Text>
        </View>
        <Text style={[styles.avisoSimulacao, { color: t.mudo }]}>
          Dados simulados para demonstração. Não são leituras da balança nem seu consumo real.
        </Text>

        <Painel titulo="Filtros" descricao="Escolha o período, alimento e meta diária." t={t}>
          <Text style={[styles.rotulo, { color: t.texto }]}>Período</Text>
          <View style={styles.pilulas}>
            {PERIODO.map(opcao => (
              <TouchableOpacity key={opcao.rotulo} style={[
                styles.pilula,
                { backgroundColor: periodoSelecionado === opcao.rotulo ? VERDE : t.cartao2, borderColor: periodoSelecionado === opcao.rotulo ? VERDE : t.borda },
              ]} onPress={() => selecionarPeriodo(opcao)} accessibilityRole="button">
                <Text style={{ color: periodoSelecionado === opcao.rotulo ? '#fff' : t.texto, fontSize: 12, fontWeight: '600' }}>
                  {opcao.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.rotulo, { color: t.texto }]}>Alimento</Text>
          <View style={styles.pilulas}>
            {ALIMENTOS.map(alimento => (
              <TouchableOpacity key={alimento} style={[
                styles.pilula,
                { backgroundColor: rascunho.alimento === alimento ? VERDE : t.cartao2, borderColor: rascunho.alimento === alimento ? VERDE : t.borda },
              ]} onPress={() => alterar('alimento', alimento)} accessibilityRole="button">
                <Text style={{ color: rascunho.alimento === alimento ? '#fff' : t.texto, fontSize: 12, fontWeight: '600' }}>{alimento}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.camposData}>
            <View style={styles.campoFlex}>
              <Text style={[styles.rotulo, { color: t.texto }]}>Data inicial</Text>
              <TextInput accessibilityLabel="Data inicial" placeholder="AAAA-MM-DD" placeholderTextColor={t.mudo}
                autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10}
                value={rascunho.inicio} onChangeText={texto => { alterar('inicio', texto); setPeriodoSelecionado(''); }}
                style={[styles.entrada, { color: t.texto, backgroundColor: t.cartao2, borderColor: t.borda }]} />
            </View>
            <View style={styles.campoFlex}>
              <Text style={[styles.rotulo, { color: t.texto }]}>Data final</Text>
              <TextInput accessibilityLabel="Data final" placeholder="AAAA-MM-DD" placeholderTextColor={t.mudo}
                autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10}
                value={rascunho.fim} onChangeText={texto => { alterar('fim', texto); setPeriodoSelecionado(''); }}
                style={[styles.entrada, { color: t.texto, backgroundColor: t.cartao2, borderColor: t.borda }]} />
            </View>
          </View>
          <Text style={[styles.rotulo, { color: t.texto }]}>Meta diária (kcal)</Text>
          <TextInput accessibilityLabel="Meta diária em kcal" keyboardType="numeric" value={rascunho.metaTexto}
            onChangeText={texto => alterar('metaTexto', texto)}
            style={[styles.entrada, { color: t.texto, backgroundColor: t.cartao2, borderColor: t.borda }]} />

          <TouchableOpacity style={styles.botaoAplicar} accessibilityRole="button" onPress={() => aplicarFiltros()}>
            <Text style={styles.botaoTexto}>Atualizar dashboard</Text>
          </TouchableOpacity>
        </Painel>

        <View style={styles.gradeIndicadores}>
          {indicadores.map(([titulo, valor]) => <Indicador key={titulo} titulo={titulo} valor={valor} t={t} />)}
        </View>

        <Painel titulo="Consumo por dia" descricao="Calorias acumuladas; linha laranja = meta diária." t={t}>
          <ConsumoDiarioChart dias={analise.dias} meta={aplicados.meta} />
        </Painel>

        <Painel titulo="Porcentagem por alimento" descricao="Participação no total de calorias consumidas." t={t}>
          {Object.entries(analise.porAlimento).map(([nome, dados]) => (
            <View key={nome} style={styles.participacao}>
              <View style={styles.participacaoCabecalho}>
                <Text style={[styles.participacaoNome, { color: t.texto }]}>{nome}</Text>
                <Text style={[styles.participacaoValor, { color: t.texto }]}>{numero(dados.percentual, 1)}%</Text>
              </View>
              <View style={[styles.barraFundo, { backgroundColor: t.trilho }]}>
                <View style={[styles.barraPreenchimento, { width: `${dados.percentual}%` }]} />
              </View>
            </View>
          ))}
        </Painel>

        <Painel titulo="Distribuição normal" descricao="Histograma de calorias e curva normal teórica." t={t}>
          <DistribuicaoNormalChart analise={analise} />
        </Painel>

        <Painel titulo="Correlação e regressão" descricao="Peso (g) × calorias (kcal)." t={t}>
          <CorrelacaoChart registros={analise.registros} modelo={analise.modelo} />
          <Text style={[styles.estatistica, { color: t.texto }]}>
            y = {numero(analise.modelo.a, 2)} + {numero(analise.modelo.b, 3)} × x
            {'\n'}Correlação (r): {numero(analise.modelo.r, 3)} | R²: {numero(analise.modelo.r2, 3)}
          </Text>
        </Painel>

        <Painel titulo="Registros recentes" t={t}>
          <Text style={[styles.estatistica, { color: t.mudo }]}>
            {analise.diasNaMeta} de {analise.dias.length} dias ficaram dentro da meta de {numero(aplicados.meta)} kcal.
          </Text>
          {analise.recentes.length ? analise.recentes.map(item => (
            <View key={item.id} style={[styles.registro, { borderBottomColor: t.borda }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.registroTitulo, { color: t.texto }]}>{item.alimento} · {item.peso} g</Text>
                <Text style={[styles.registroSubtitulo, { color: t.mudo }]}>{item.data}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.registroTitulo, { color: VERDE }]}>{numero(item.calorias, 2)} kcal</Text>
                <Text style={{ fontSize: 11, color: item.alarme ? '#D97706' : t.mudo }}>
                  {item.alarme ? 'Alarme disparou' : 'Normal'}
                </Text>
              </View>
            </View>
          )) : <Text style={{ color: t.mudo }}>Nenhum registro no período selecionado.</Text>}
          <TouchableOpacity style={styles.botaoAplicar} onPress={compartilharCSV} disabled={exportando} accessibilityRole="button">
            <Text style={styles.botaoTexto}>{exportando ? 'Preparando...' : 'Compartilhar dados em CSV'}</Text>
          </TouchableOpacity>
          <Text style={[styles.observacao, { color: t.mudo }]}>
            O compartilhamento nativo envia o conteúdo CSV como texto. Para mais de 2.500 registros, reduza o período.
          </Text>
        </Painel>
        <Text style={[styles.rodape, { color: t.mudo }]}>SafeBite · Dashboard demonstrativo</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: { height: 54, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  voltar: { width: 62, justifyContent: 'center', minHeight: 42 },
  voltarTexto: { fontSize: 15, fontWeight: '700' },
  topoTitulo: { fontSize: 17, fontWeight: '800' },
  conteudo: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 16, gap: 14 },
  banner: { padding: 20, borderRadius: 17, backgroundColor: '#15966A', gap: 8 },
  bannerMarca: { color: '#D7F7E9', fontWeight: '800', fontSize: 13 },
  bannerTitulo: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  bannerSubtitulo: { color: '#E5F7EF', fontSize: 14, lineHeight: 21 },
  avisoSimulacao: { fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  painel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 13 },
  painelTitulo: { fontSize: 18, fontWeight: '800' },
  painelDescricao: { fontSize: 13, lineHeight: 18, marginTop: -8 },
  rotulo: { fontWeight: '700', fontSize: 13 },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pilula: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9, borderWidth: 1 },
  camposData: { flexDirection: 'row', gap: 10 },
  campoFlex: { flex: 1, gap: 8, minWidth: 0 },
  entrada: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontSize: 14 },
  botaoAplicar: { backgroundColor: VERDE, alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: 12, borderRadius: 10 },
  botaoTexto: { color: '#fff', fontWeight: '800', fontSize: 14 },
  gradeIndicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  indicador: { width: '48%', flexGrow: 1, padding: 14, minHeight: 96, borderRadius: 14, borderWidth: 1, justifyContent: 'space-between', gap: 8 },
  indicadorRotulo: { fontSize: 12, lineHeight: 16 },
  indicadorValor: { fontSize: 20, fontWeight: '800' },
  participacao: { gap: 7, marginBottom: 7 },
  participacaoCabecalho: { flexDirection: 'row', justifyContent: 'space-between' },
  participacaoNome: { fontSize: 14, fontWeight: '600' },
  participacaoValor: { fontSize: 14, fontWeight: '700' },
  barraFundo: { height: 12, borderRadius: 8, overflow: 'hidden' },
  barraPreenchimento: { height: '100%', backgroundColor: VERDE, borderRadius: 8 },
  estatistica: { fontSize: 12, lineHeight: 20 },
  registro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  registroTitulo: { fontSize: 13, fontWeight: '700' },
  registroSubtitulo: { fontSize: 11 },
  observacao: { fontSize: 11, lineHeight: 16 },
  rodape: { fontSize: 11, textAlign: 'center', paddingVertical: 12 },
});