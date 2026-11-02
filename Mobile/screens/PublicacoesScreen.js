
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import apiService from '../services/api';

export default function PublicacoesScreen({ navigation }) {
  const [busca, setBusca] = useState('');
  const [publicacoes, setPublicacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [excluindoId, setExcluindoId] = useState(null);

  const carregarPublicacoes = useCallback(
    async (atualizacao = false) => {
      if (atualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro('');

      try {
        const resposta = await apiService.listRecipes();

        if (!resposta?.success) {
          throw new Error(
            resposta?.message ||
              'Não foi possível carregar as receitas.'
          );
        }

        const dados = resposta.data;

        const lista = Array.isArray(dados)
          ? dados
          : Array.isArray(dados?.recipes)
            ? dados.recipes
            : Array.isArray(dados?.receitas)
              ? dados.receitas
              : [];

        setPublicacoes(lista);
      } catch (error) {
        setErro(
          error?.message || 'Erro ao carregar publicações.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      carregarPublicacoes();
    }, [carregarPublicacoes])
  );

  const publicacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return publicacoes;
    }

    return publicacoes.filter((item) => {
      const titulo = String(item.titulo || '').toLowerCase();
      const descricao = String(
        item.descricao || ''
      ).toLowerCase();

      const autor = String(
        item.autor?.nome ||
          item.usuario?.nome ||
          item.user?.nome ||
          item.nome_usuario ||
          ''
      ).toLowerCase();

      return (
        titulo.includes(termo) ||
        descricao.includes(termo) ||
        autor.includes(termo)
      );
    });
  }, [busca, publicacoes]);

  function abrirFormulario() {
    navigation.navigate('ReceitaFormulario');
  }

  function obterId(receita) {
    return receita.id || receita._id || receita.recipe_id;
  }

  function obterIngredientes(receita) {
    const valor = receita.ingredientes;

    if (Array.isArray(valor)) {
      return valor
        .map((item) =>
          typeof item === 'string'
            ? item
            : item?.nome || item?.ingrediente || ''
        )
        .filter(Boolean);
    }

    if (typeof valor === 'string') {
      try {
        const convertido = JSON.parse(valor);

        if (Array.isArray(convertido)) {
          return convertido.map((item) =>
            typeof item === 'string'
              ? item
              : item?.nome || item?.ingrediente || ''
          ).filter(Boolean);
        }
      } catch {
        return valor
          .split(/\r?\n|;/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return valor
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function obterAutor(receita) {
    return (
      receita.autor?.nome ||
      receita.usuario?.nome ||
      receita.user?.nome ||
      receita.nome_usuario ||
      'Comunidade Safe Bite'
    );
  }

  function obterIniciais(nome) {
    return String(nome || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();
  }

  function obterImagem(receita) {
    return (
      receita.image_url ||
      receita.imagem_url ||
      receita.imagem ||
      receita.image ||
      null
    );
  }

  function abrirReceita(receita) {
    navigation.navigate('ReceitaDetalhe', {
      receita: {
        ...receita,
        id: obterId(receita),
        titulo: receita.titulo,
        descricao: receita.descricao || '',
        ingredientes: obterIngredientes(receita),
        modoPreparo:
          receita.modo_preparo ||
          receita.modoPreparo ||
          '',
      },
    });
  }

  function confirmarExclusao(publicacao) {
    const id = obterId(publicacao);

    if (!id) {
      Alert.alert(
        'Não foi possível excluir',
        'Esta publicação não possui um identificador válido.'
      );
      return;
    }

    if (excluindoId !== null) {
      return;
    }

    Alert.alert(
      'Excluir publicação',
      `Deseja realmente excluir "${publicacao.titulo || 'esta receita'}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => executarExclusao(publicacao, id),
        },
      ]
    );
  }

  async function executarExclusao(publicacao, id) {
    if (excluindoId !== null) {
      return;
    }

    setExcluindoId(String(id));

    try {
      const resposta = await apiService.deleteRecipe(id);

      if (resposta?.success === false) {
        throw new Error(
          resposta.message || 'Não foi possível excluir a receita.'
        );
      }

      setPublicacoes((atuais) =>
        atuais.filter(
          (item) => String(obterId(item)) !== String(id)
        )
      );

      Alert.alert(
        'Publicação excluída',
        'A receita foi removida com sucesso.'
      );
    } catch (error) {
      Alert.alert(
        'Erro ao excluir',
        error?.message ||
          'Não foi possível excluir a publicação. Tente novamente.'
      );
    } finally {
      setExcluindoId(null);
    }
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
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.textoVoltar}>‹</Text>
        </TouchableOpacity>

        <View style={styles.cabecalhoInfo}>
          <Text style={styles.tituloPagina}>Publicações</Text>
          <Text style={styles.subtitulo}>
            Receitas compartilhadas pela comunidade
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={abrirFormulario}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Registrar nova receita"
        >
          <Text style={styles.simboloAdicionar}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarPublicacoes(true)}
            colors={['#F5A623']}
          />
        }
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitulo}>
            Compartilhe suas receitas
          </Text>

          <Text style={styles.bannerDescricao}>
            Publique seus pratos e ajude outras pessoas a descobrir
            novas opções para o dia a dia.
          </Text>

          <TouchableOpacity
            style={styles.botaoPublicar}
            onPress={abrirFormulario}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotaoPublicar}>
              Registrar receita
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tituloSecao}>
          Explorar publicações
        </Text>

        <View style={styles.buscaContainer}>
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por receita ou autor"
            placeholderTextColor="#9CA3AF"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
          />

          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Text style={styles.limparBusca}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.quantidade}>
          {publicacoesFiltradas.length}{' '}
          {publicacoesFiltradas.length === 1
            ? 'publicação encontrada'
            : 'publicações encontradas'}
        </Text>

        {carregando ? (
          <View style={styles.vazio}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.vazioDescricao}>
              Carregando publicações...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>
              Não foi possível carregar as receitas
            </Text>

            <Text style={styles.vazioDescricao}>{erro}</Text>

            <TouchableOpacity
              style={styles.botaoPublicar}
              onPress={() => carregarPublicacoes()}
            >
              <Text style={styles.textoBotaoPublicar}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : publicacoesFiltradas.length > 0 ? (
          publicacoesFiltradas.map((publicacao, index) => {
            const id = obterId(publicacao);
            const autor = obterAutor(publicacao);
            const ingredientesReceita =
              obterIngredientes(publicacao);
            const imagem = obterImagem(publicacao);
            const estaExcluindo =
              excluindoId !== null &&
              String(excluindoId) === String(id);

            return (
              <View
                key={String(id || index)}
                style={styles.cartao}
              >
                <TouchableOpacity
                  onPress={() => abrirReceita(publicacao)}
                  activeOpacity={0.85}
                >
                  <View style={styles.autorLinha}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTexto}>
                        {obterIniciais(autor)}
                      </Text>
                    </View>

                    <View style={styles.autorInfo}>
                      <Text style={styles.nomeAutor}>
                        {autor}
                      </Text>
                      <Text style={styles.categoria}>
                        Receita publicada
                      </Text>
                    </View>
                  </View>

                  {imagem ? (
                    <Image
                      source={{ uri: imagem }}
                      style={styles.imagemReceita}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagemPlaceholder}>
                      <Text style={styles.iniciaisReceita}>
                        {obterIniciais(
                          publicacao.titulo || 'Receita'
                        )}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cartaoConteudo}>
                    <Text style={styles.tituloReceita}>
                      {publicacao.titulo || 'Receita sem título'}
                    </Text>

                    <Text style={styles.descricaoReceita}>
                      {publicacao.descricao || 'Sem descrição.'}
                    </Text>

                    <View style={styles.rodapeCartao}>
                      <Text style={styles.textoIngredientes}>
                        {ingredientesReceita.length} ingredientes
                      </Text>

                      <Text style={styles.linkDetalhes}>
                        Ver detalhes
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.areaExclusao}>
                  <TouchableOpacity
                    style={[
                      styles.botaoExcluir,
                      estaExcluindo && styles.botaoExcluirDesabilitado,
                    ]}
                    onPress={() => confirmarExclusao(publicacao)}
                    disabled={excluindoId !== null}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${publicacao.titulo || 'publicação'}`}
                  >
                    {estaExcluindo ? (
                      <ActivityIndicator
                        size="small"
                        color="#C62828"
                      />
                    ) : (
                      <Text style={styles.textoExcluir}>
                        Excluir publicação
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>
              {busca
                ? 'Nenhuma publicação encontrada'
                : 'Ainda não há receitas publicadas'}
            </Text>

            <Text style={styles.vazioDescricao}>
              {busca
                ? 'Tente pesquisar por outro nome.'
                : 'Seja a primeira pessoa a compartilhar uma receita com a comunidade.'}
            </Text>

            {busca ? (
              <TouchableOpacity onPress={() => setBusca('')}>
                <Text style={styles.linkLimpar}>
                  Limpar pesquisa
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.botaoPublicar}
                onPress={abrirFormulario}
              >
                <Text style={styles.textoBotaoPublicar}>
                  Registrar receita
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.rodape}>
          Safe Bite — Compartilhe com responsabilidade.
        </Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  botaoVoltar: {
    width: 35,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },

  textoVoltar: {
    fontSize: 36,
    lineHeight: 40,
    color: '#1A1A1A',
  },

  cabecalhoInfo: {
    flex: 1,
  },

  tituloPagina: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  subtitulo: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 5,
  },

  botaoAdicionar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  simboloAdicionar: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 34,
  },

  conteudo: {
    padding: 18,
    paddingBottom: 35,
  },

  banner: {
    backgroundColor: '#FFF0D4',
    borderRadius: 18,
    padding: 20,
    marginBottom: 26,
  },

  bannerTitulo: {
    fontSize: 21,
    fontWeight: '800',
    color: '#262626',
    marginBottom: 9,
  },

  bannerDescricao: {
    fontSize: 13,
    color: '#6B5A3E',
    lineHeight: 20,
    marginBottom: 18,
  },

  botaoPublicar: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5A623',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },

  textoBotaoPublicar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  tituloSecao: {
    fontSize: 19,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 15,
  },

  buscaContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 13,
    marginBottom: 13,
  },

  inputBusca: {
    flex: 1,
    fontSize: 13,
    color: '#262626',
    paddingVertical: 13,
  },

  limparBusca: {
    color: '#B77912',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },

  quantidade: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },

  autorLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7F6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarTexto: {
    color: '#16803D',
    fontWeight: '800',
    fontSize: 12,
  },

  autorInfo: {
    flex: 1,
  },

  nomeAutor: {
    color: '#262626',
    fontSize: 13,
    fontWeight: '700',
  },

  categoria: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },

  imagemPlaceholder: {
    height: 145,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagemReceita: {
    height: 145,
    width: '100%',
    backgroundColor: '#EEEEEE',
  },

  iniciaisReceita: {
    color: '#B77912',
    fontSize: 35,
    fontWeight: '800',
  },

  cartaoConteudo: {
    padding: 16,
  },

  tituloReceita: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },

  descricaoReceita: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
  },

  rodapeCartao: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 15,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  textoIngredientes: {
    color: '#6B7280',
    fontSize: 11,
  },

  linkDetalhes: {
    color: '#16803D',
    fontSize: 12,
    fontWeight: '700',
  },

  areaExclusao: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },

  botaoExcluir: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  botaoExcluirDesabilitado: {
    opacity: 0.6,
  },

  textoExcluir: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '700',
  },

  vazio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  vazioTitulo: {
    color: '#262626',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  vazioDescricao: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },

  linkLimpar: {
    color: '#16803D',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 15,
  },

  rodape: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});
