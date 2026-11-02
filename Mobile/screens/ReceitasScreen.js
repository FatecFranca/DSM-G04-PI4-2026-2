import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import apiService from '../services/api';

export default function ReceitasScreen({ navigation }) {
  const [pesquisa, setPesquisa] = useState('');
  const [receitas, setReceitas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarReceitas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const resposta = await apiService.listRecipes({ limit: 100 });

      // Aceita os formatos de resposta mais comuns da API.
      const lista =
        Array.isArray(resposta) ? resposta :
        Array.isArray(resposta?.data) ? resposta.data :
        Array.isArray(resposta?.data?.receitas) ? resposta.data.receitas :
        Array.isArray(resposta?.data?.recipes) ? resposta.data.recipes :
        Array.isArray(resposta?.receitas) ? resposta.receitas :
        Array.isArray(resposta?.recipes) ? resposta.recipes :
        Array.isArray(resposta?.results) ? resposta.results :
        Array.isArray(resposta?.data?.results) ? resposta.data.results :
        [];

      setReceitas(
        lista.map((receita) => ({
          ...receita,
          id: String(
            receita.id ??
            receita._id ??
            receita.receita_id ??
            ''
          ),
          titulo:
            receita.titulo ??
            receita.nome ??
            receita.title ??
            'Receita sem título',
          descricao:
            receita.descricao ??
            receita.description ??
            '',
          imagem_url:
            receita.imagem_url ??
            receita.image_url ??
            receita.imagem ??
            receita.foto_url ??
            receita.image ??
            null,
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      setErro(
        error.message ||
        'Não foi possível carregar as receitas. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarReceitas();
  }, [carregarReceitas]);

  const receitasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return receitas;
    }

    return receitas.filter((receita) => {
      const titulo = String(receita.titulo || '').toLowerCase();
      const descricao = String(receita.descricao || '').toLowerCase();

      return titulo.includes(termo) || descricao.includes(termo);
    });
  }, [pesquisa, receitas]);

  function abrirReceita(receita) {
    navigation.navigate('ReceitaDetalhe', {
      receita,
      receitaId: receita.id || receita._id,
    });
  }

  function limparPesquisa() {
    setPesquisa('');
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.cabecalho}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.textoVoltar}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.tituloCabecalho}>
          Receitas
        </Text>

        <View style={styles.espacador} />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introducao}>
          <Text style={styles.titulo}>
            Encontre sua próxima receita
          </Text>

          <Text style={styles.subtitulo}>
            Pesquise pelo nome do prato ou explore as receitas
            disponíveis.
          </Text>
        </View>

        <View style={styles.pesquisaContainer}>
          <Text style={styles.simboloPesquisa}>⌕</Text>

          <TextInput
            style={styles.inputPesquisa}
            placeholder="Buscar receita"
            placeholderTextColor="#9CA3AF"
            value={pesquisa}
            onChangeText={setPesquisa}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {pesquisa.length > 0 && (
            <TouchableOpacity
              onPress={limparPesquisa}
              accessibilityRole="button"
              accessibilityLabel="Limpar pesquisa"
            >
              <Text style={styles.limpar}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tituloListaContainer}>
          <Text style={styles.tituloLista}>
            {pesquisa.trim()
              ? 'Resultados da pesquisa'
              : 'Receitas disponíveis'}
          </Text>

          <Text style={styles.contagem}>
            {receitasFiltradas.length}
          </Text>
        </View>

        {carregando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#F5A623" />

            <Text style={styles.textoEstado}>
              Carregando receitas...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.semResultados}>
            <Text style={styles.tituloSemResultados}>
              Não foi possível carregar
            </Text>

            <Text style={styles.textoSemResultados}>
              {erro}
            </Text>

            <TouchableOpacity
              style={styles.botaoLimpar}
              onPress={carregarReceitas}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotaoLimpar}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : receitasFiltradas.length > 0 ? (
          receitasFiltradas.map((receita, index) => (
            <TouchableOpacity
              key={receita.id || receita._id || `receita-${index}`}
              style={styles.cardReceita}
              onPress={() => abrirReceita(receita)}
              activeOpacity={0.8}
            >
              <View style={styles.imagemContainer}>
                {receita.imagem_url ? (
                  <Image
                    source={{ uri: receita.imagem_url }}
                    style={styles.imagemReceita}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagemPlaceholder}>
                    <Text style={styles.iniciais}>
                      {String(receita.titulo || 'R')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((palavra) => palavra[0])
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.dadosReceita}>
                <Text style={styles.nomeReceita}>
                  {receita.titulo || 'Receita sem título'}
                </Text>

                {!!receita.descricao && (
                  <Text style={styles.descricaoReceita}>
                    {receita.descricao.length > 90
                      ? `${receita.descricao.substring(0, 90)}...`
                      : receita.descricao}
                  </Text>
                )}

                <Text style={styles.linkDetalhes}>
                  Ver receita  ›
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.semResultados}>
            <Text style={styles.tituloSemResultados}>
              {pesquisa.trim()
                ? 'Nenhuma receita encontrada'
                : 'Nenhuma receita disponível'}
            </Text>

            <Text style={styles.textoSemResultados}>
              {pesquisa.trim()
                ? `Não encontramos receitas para "${pesquisa}". Tente outro termo de pesquisa.`
                : 'Ainda não existem receitas para exibir.'}
            </Text>

            {pesquisa.trim() && (
              <TouchableOpacity
                style={styles.botaoLimpar}
                onPress={limparPesquisa}
              >
                <Text style={styles.textoBotaoLimpar}>
                  Limpar pesquisa
                </Text>
              </TouchableOpacity>
            )}

            {!pesquisa.trim() && (
              <TouchableOpacity
                style={styles.botaoLimpar}
                onPress={carregarReceitas}
              >
                <Text style={styles.textoBotaoLimpar}>
                  Atualizar receitas
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  cabecalho: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  botaoVoltar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoVoltar: {
    fontSize: 34,
    color: '#333333',
    lineHeight: 38,
  },

  tituloCabecalho: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  espacador: {
    width: 38,
  },

  conteudo: {
    padding: 18,
    paddingBottom: 36,
  },

  introducao: {
    marginTop: 8,
    marginBottom: 22,
  },

  titulo: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 9,
  },

  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },

  pesquisaContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  simboloPesquisa: {
    fontSize: 25,
    color: '#9CA3AF',
    marginRight: 10,
  },

  inputPesquisa: {
    flex: 1,
    minHeight: 50,
    fontSize: 14,
    color: '#1A1A1A',
  },

  limpar: {
    fontSize: 12,
    color: '#B77912',
    fontWeight: '700',
    paddingLeft: 8,
  },

  tituloListaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  tituloLista: {
    fontSize: 17,
    fontWeight: '700',
    color: '#262626',
  },

  contagem: {
    color: '#6B7280',
    fontSize: 13,
  },

  cardReceita: {
    flexDirection: 'row',
    minHeight: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 12,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  imagemContainer: {
    width: 100,
    minHeight: 106,
    marginRight: 13,
  },

  imagemReceita: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },

  imagemPlaceholder: {
    flex: 1,
    minHeight: 106,
    borderRadius: 11,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iniciais: {
    color: '#B77912',
    fontSize: 24,
    fontWeight: '800',
  },

  dadosReceita: {
    flex: 1,
    justifyContent: 'center',
  },

  nomeReceita: {
    fontSize: 15,
    fontWeight: '700',
    color: '#252525',
    marginBottom: 7,
  },

  descricaoReceita: {
    fontSize: 12,
    color: '#777777',
    lineHeight: 18,
  },

  linkDetalhes: {
    color: '#B77912',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },

  estado: {
    padding: 30,
    alignItems: 'center',
  },

  textoEstado: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },

  semResultados: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  tituloSemResultados: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    textAlign: 'center',
    marginBottom: 8,
  },

  textoSemResultados: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },

  botaoLimpar: {
    marginTop: 18,
    backgroundColor: '#F5A623',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },

  textoBotaoLimpar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});