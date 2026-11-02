
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import api from '../services/api';

const restricoesDisponiveis = [
  {
    id: 'lactose',
    titulo: 'Intolerância à lactose',
    descricao: 'Leite e derivados que contenham lactose',
    categoria: 'Intolerâncias',
    nomesBanco: ['Intolerância à lactose', 'Lactose'],
  },
  {
    id: 'gluten',
    titulo: 'Glúten',
    descricao: 'Trigo, cevada, centeio e derivados',
    categoria: 'Intolerâncias',
    nomesBanco: ['Glúten', 'Gluten'],
  },
  {
    id: 'amendoim',
    titulo: 'Amendoim',
    descricao: 'Amendoim e produtos derivados',
    categoria: 'Alergias',
    nomesBanco: ['Amendoim'],
  },
  {
    id: 'castanhas',
    titulo: 'Castanhas e nozes',
    descricao: 'Castanhas, nozes e outras oleaginosas',
    categoria: 'Alergias',
    nomesBanco: ['Castanhas e nozes', 'Castanhas', 'Nozes'],
  },
  {
    id: 'ovo',
    titulo: 'Ovos',
    descricao: 'Ovos e ingredientes derivados',
    categoria: 'Alergias',
    nomesBanco: ['Ovos', 'Ovo'],
  },
  {
    id: 'leite',
    titulo: 'Proteínas do leite',
    descricao: 'Proteínas como caseína e whey protein',
    categoria: 'Alergias',
    nomesBanco: ['Proteínas do leite', 'Proteinas do leite'],
  },
  {
    id: 'soja',
    titulo: 'Soja',
    descricao: 'Soja e produtos derivados',
    categoria: 'Alergias',
    nomesBanco: ['Soja'],
  },
  {
    id: 'frutos_mar',
    titulo: 'Peixes e frutos do mar',
    descricao: 'Peixes, crustáceos e moluscos',
    categoria: 'Alergias',
    nomesBanco: [
      'Peixes e frutos do mar',
      'Frutos do mar',
      'Peixes',
    ],
  },
];

function normalizarNome(nome = '') {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function obterDados(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function obterId(item) {
  return item?.id ?? item?._id ?? null;
}

export default function RestricoesScreen({ navigation }) {
  const [selecionadas, setSelecionadas] = useState([]);
  const [restricoesBanco, setRestricoesBanco] = useState([]);
  const [restricoesUsuario, setRestricoesUsuario] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarRestricoes = useCallback(async () => {
    setCarregando(true);

    try {
      const [resDisponiveis, resUsuario] = await Promise.all([
        api.listRestrictions(),
        api.getUserRestrictions(),
      ]);

      const disponiveis = obterDados(resDisponiveis);
      const doUsuario = obterDados(resUsuario);

      if (!Array.isArray(disponiveis) || !Array.isArray(doUsuario)) {
        throw new Error(
          'O backend retornou um formato inesperado para as restrições.'
        );
      }

      setRestricoesBanco(disponiveis);
      setRestricoesUsuario(doUsuario);

      const idsSelecionados = [];

      doUsuario.forEach((associacao) => {
        const restricao = associacao.restriction;

        if (!restricao) return;

        const opcao = restricoesDisponiveis.find((item) =>
          item.nomesBanco.some(
            (nome) =>
              normalizarNome(nome) ===
              normalizarNome(restricao.nome)
          )
        );

        if (opcao && !idsSelecionados.includes(opcao.id)) {
          idsSelecionados.push(opcao.id);
        }
      });

      setSelecionadas(idsSelecionados);
    } catch (error) {
      console.error('Erro ao carregar restrições:', error);

      Alert.alert(
        'Erro ao carregar',
        error.message ||
          'Não foi possível carregar suas restrições. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarRestricoes();
  }, [carregarRestricoes]);

  function alternarRestricao(id) {
    setSelecionadas((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  function encontrarRestricaoBanco(opcao) {
    return restricoesBanco.find((restricao) =>
      opcao.nomesBanco.some(
        (nome) =>
          normalizarNome(nome) ===
          normalizarNome(restricao.nome)
      )
    );
  }

  async function salvarRestricoes() {
    if (salvando || carregando) return;

    setSalvando(true);

    try {
      const selecionadasComRegistro = selecionadas.map((id) => {
        const opcao = restricoesDisponiveis.find(
          (item) => item.id === id
        );

        const restricaoBanco = opcao
          ? encontrarRestricaoBanco(opcao)
          : null;

        return { opcao, restricaoBanco };
      });

      const semCadastro = selecionadasComRegistro.filter(
        (item) => !item.restricaoBanco
      );

      if (semCadastro.length > 0) {
        const nomes = semCadastro
          .map((item) => item.opcao.titulo)
          .join(', ');

        Alert.alert(
          'Restrições não cadastradas',
          `Estas opções ainda não foram encontradas no banco de dados: ${nomes}.\n\nCadastre essas restrições na coleção Restriction antes de salvá-las.`
        );
        return;
      }

      const idsDesejados = new Set(
        selecionadasComRegistro.map((item) =>
          String(obterId(item.restricaoBanco))
        )
      );

      const associacoesAtuais = restricoesUsuario;

      const paraRemover = associacoesAtuais.filter((associacao) => {
        const restrictionId =
          associacao.restriction_id?.id ??
          associacao.restriction_id?._id ??
          associacao.restriction_id;

        return (
          restrictionId &&
          !idsDesejados.has(String(restrictionId))
        );
      });

      const idsAtuais = new Set(
        associacoesAtuais
          .map((associacao) => {
            const restrictionId =
              associacao.restriction_id?.id ??
              associacao.restriction_id?._id ??
              associacao.restriction_id;

            return restrictionId ? String(restrictionId) : null;
          })
          .filter(Boolean)
      );

      const paraAdicionar = selecionadasComRegistro.filter(
        (item) =>
          !idsAtuais.has(String(obterId(item.restricaoBanco)))
      );

      for (const associacao of paraRemover) {
        const associacaoId = obterId(associacao);

        if (associacaoId) {
          await api.removeRestriction(associacaoId);
        }
      }

      for (const item of paraAdicionar) {
        await api.addUserRestriction(
          String(obterId(item.restricaoBanco))
        );
      }

      await carregarRestricoes();

      Alert.alert(
        'Sucesso',
        'Suas restrições alimentares foram salvas.'
      );
    } catch (error) {
      console.error('Erro ao salvar restrições:', error);

      Alert.alert(
        'Erro ao salvar',
        error.message ||
          'Não foi possível salvar todas as alterações. Tente novamente.'
      );

      // Atualiza a tela com o estado real do banco após uma falha.
      await carregarRestricoes();
    } finally {
      setSalvando(false);
    }
  }

  function limparSelecao() {
    Alert.alert(
      'Limpar seleção',
      'Deseja desmarcar todas as restrições? As alterações só serão salvas quando você tocar em "Salvar restrições".',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: () => setSelecionadas([]),
        },
      ]
    );
  }

  function renderizarGrupo(categoria) {
    const itens = restricoesDisponiveis.filter(
      (item) => item.categoria === categoria
    );

    return (
      <View style={styles.section} key={categoria}>
        <Text style={styles.sectionTitle}>{categoria}</Text>

        {itens.map((item) => {
          const selecionada = selecionadas.includes(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.restricaoCard,
                selecionada && styles.restricaoSelecionada,
              ]}
              activeOpacity={0.8}
              disabled={carregando || salvando}
              onPress={() => alternarRestricao(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  selecionada && styles.checkboxAtivo,
                ]}
              >
                {selecionada && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              <View style={styles.restricaoInfo}>
                <Text style={styles.restricaoTitulo}>
                  {item.titulo}
                </Text>

                <Text style={styles.restricaoDescricao}>
                  {item.descricao}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          disabled={salvando}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Restrições alimentares
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>
            Personalize sua alimentação
          </Text>

          <Text style={styles.introDescription}>
            Selecione as alergias ou intolerâncias que deseja
            considerar ao consultar receitas.
          </Text>

          <View style={styles.counterContainer}>
            <Text style={styles.counter}>
              {selecionadas.length}
            </Text>
            <Text style={styles.counterLabel}>
              {selecionadas.length === 1
                ? 'restrição selecionada'
                : 'restrições selecionadas'}
            </Text>
          </View>
        </View>

        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>
              Carregando restrições...
            </Text>
          </View>
        ) : (
          <>
            {renderizarGrupo('Alergias')}
            {renderizarGrupo('Intolerâncias')}

            <TouchableOpacity
              style={styles.reloadButton}
              onPress={carregarRestricoes}
              disabled={salvando}
            >
              <Text style={styles.reloadButtonText}>
                Atualizar restrições
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>
            Importante sobre sua segurança
          </Text>

          <Text style={styles.warningText}>
            Esta seleção é informativa e não substitui a leitura
            dos rótulos, a verificação de contaminação cruzada ou
            a orientação de um profissional de saúde. A ausência
            de um ingrediente na descrição não garante que o
            alimento seja seguro.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (carregando || salvando) && styles.buttonDisabled,
          ]}
          disabled={carregando || salvando}
          onPress={salvarRestricoes}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Salvar restrições
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          disabled={carregando || salvando}
          onPress={limparSelecao}
        >
          <Text style={styles.clearButtonText}>
            Limpar seleção
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 35,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 34,
    lineHeight: 38,
    color: '#1A1A1A',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSpace: {
    width: 35,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  introCard: {
    backgroundColor: '#FFF3DD',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  introDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginTop: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
  },
  counter: {
    fontSize: 23,
    fontWeight: '800',
    color: '#D88900',
    marginRight: 8,
  },
  counterLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  restricaoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restricaoSelecionada: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FAF3',
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxAtivo: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  restricaoInfo: {
    flex: 1,
  },
  restricaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  restricaoDescricao: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    padding: 15,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 7,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#F5A623',
    marginHorizontal: 16,
    marginTop: 22,
    height: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearButton: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  reloadButton: {
    alignItems: 'center',
    padding: 12,
  },
  reloadButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
