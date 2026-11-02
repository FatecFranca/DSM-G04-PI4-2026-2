
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

import api from '../services/api';

function transformarLista(valor) {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor !== 'string' || !valor.trim()) {
    return [];
  }

  try {
    const resultado = JSON.parse(valor);

    if (Array.isArray(resultado)) {
      return resultado;
    }
  } catch (error) {
    // O conteúdo também pode ser texto separado por linhas.
  }

  return valor
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obterDadosRestricoes(resposta) {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  return [];
}

function verificarConflitos(ingredientes, restricoes) {
  const conflitos = [];

  const ingredientesTexto = ingredientes.map((ingrediente) => {
    if (typeof ingrediente === 'string') {
      return ingrediente;
    }

    return (
      ingrediente?.nome ||
      ingrediente?.ingrediente ||
      ingrediente?.descricao ||
      ''
    );
  });

  restricoes.forEach((item) => {
    const restricao = item.restriction || item.restricao || item;

    const nomeRestricao =
      restricao.nome || 'Restrição alimentar';

    const palavrasChave = [
      ...(Array.isArray(restricao.palavras_chave)
        ? restricao.palavras_chave
        : []),
      ...(Array.isArray(item.palavras_chave_personalizadas)
        ? item.palavras_chave_personalizadas
        : []),
    ]
      .filter(Boolean)
      .map(normalizarTexto)
      .filter(Boolean);

    ingredientesTexto.forEach((ingrediente) => {
      const ingredienteNormalizado = normalizarTexto(ingrediente);

      if (!ingredienteNormalizado) {
        return;
      }

      const palavraEncontrada = palavrasChave.find(
        (palavra) => ingredienteNormalizado.includes(palavra)
      );

      if (palavraEncontrada) {
        conflitos.push({
          restricao: nomeRestricao,
          ingrediente,
          palavraChave: palavraEncontrada,
        });
      }
    });
  });

  return conflitos.filter(
    (conflito, index, lista) =>
      lista.findIndex(
        (outro) =>
          outro.restricao === conflito.restricao &&
          outro.ingrediente === conflito.ingrediente
      ) === index
  );
}

export default function ReceitaDetalheScreen({
  navigation,
  route,
}) {
  const receita = route?.params?.receita || {};

  const [restricoes, setRestricoes] = useState([]);
  const [carregandoRestricoes, setCarregandoRestricoes] =
    useState(true);
  const [erroRestricoes, setErroRestricoes] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarRestricoes() {
      try {
        setCarregandoRestricoes(true);
        setErroRestricoes(false);

        const resposta = await api.getUserRestrictions();
        const dados = obterDadosRestricoes(resposta);

        if (ativo) {
          setRestricoes(dados);
        }
      } catch (error) {
        console.log(
          'Erro ao carregar restrições alimentares:',
          error.message
        );

        if (ativo) {
          setErroRestricoes(true);
        }
      } finally {
        if (ativo) {
          setCarregandoRestricoes(false);
        }
      }
    }

    carregarRestricoes();

    return () => {
      ativo = false;
    };
  }, []);

  const titulo =
    receita.titulo || receita.nome || 'Detalhes da receita';

  const descricao = receita.descricao || '';

  const ingredientes = transformarLista(receita.ingredientes);

  const conflitos = verificarConflitos(
    ingredientes,
    restricoes
  );

  const modoPreparo = transformarLista(
    receita.modoPreparo || receita.modo_preparo
  );

  const tempo = receita.tempo;

  const tempoPreparo =
    typeof tempo === 'object' && tempo !== null
      ? tempo.preparo
      : tempo || receita.tempo_preparo;

  const rendimento =
    typeof tempo === 'object' && tempo !== null
      ? tempo.rendimento
      : receita.rendimento;

  const imagemUrl = receita.imagem_url || receita.imagem;

  function voltar() {
    navigation.goBack();
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
          onPress={voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar para receitas"
        >
          <Text style={styles.textoVoltar}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.tituloCabecalho}>
          Detalhes da receita
        </Text>

        <View style={styles.espacador} />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {imagemUrl ? (
          <Image
            source={{ uri: imagemUrl }}
            style={styles.imagem}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagemPlaceholder}>
            <Text style={styles.iniciais}>
              {titulo
                .split(' ')
                .slice(0, 2)
                .map((palavra) => palavra[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.introducao}>
          <Text style={styles.tituloReceita}>
            {titulo}
          </Text>

          {!!descricao && (
            <Text style={styles.descricao}>
              {descricao}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.aviso,
            !carregandoRestricoes &&
              !erroRestricoes &&
              conflitos.length > 0 &&
              styles.avisoConflito,
            erroRestricoes && styles.avisoErro,
          ]}
        >
          <Text
            style={[
              styles.tituloAviso,
              !carregandoRestricoes &&
                !erroRestricoes &&
                conflitos.length > 0 &&
                styles.tituloAvisoConflito,
            ]}
          >
            {carregandoRestricoes
              ? 'Verificando restrições alimentares'
              : erroRestricoes
                ? 'Não foi possível verificar suas restrições'
                : conflitos.length > 0
                  ? 'Possível conflito alimentar'
                  : 'Atenção às restrições alimentares'}
          </Text>

          {carregandoRestricoes ? (
            <Text style={styles.textoAviso}>
              Aguarde enquanto verificamos os ingredientes com
              suas restrições cadastradas.
            </Text>
          ) : erroRestricoes ? (
            <Text style={styles.textoAviso}>
              Não foi possível carregar suas restrições.
              Confira sua conexão e tente novamente. A
              compatibilidade desta receita não foi confirmada.
            </Text>
          ) : conflitos.length > 0 ? (
            <>
              <Text style={styles.textoAviso}>
                Encontramos ingredientes que podem estar
                relacionados às suas restrições:
              </Text>

              {conflitos.map((conflito, index) => (
                <View
                  key={`${conflito.restricao}-${conflito.ingrediente}-${index}`}
                  style={styles.conflitoItem}
                >
                  <Text style={styles.textoConflito}>
                    {conflito.restricao}
                  </Text>

                  <Text style={styles.detalheConflito}>
                    Ingrediente: {String(conflito.ingrediente)}
                  </Text>
                </View>
              ))}

              <Text style={styles.textoAviso}>
                Não consuma a receita sem confirmar a composição
                dos ingredientes e dos produtos utilizados.
              </Text>
            </>
          ) : (
            <Text style={styles.textoAviso}>
              Nenhuma correspondência foi identificada entre
              os ingredientes informados e suas restrições
              cadastradas. Isso não garante que a receita seja
              segura: confira os rótulos e possíveis
              contaminações cruzadas.
            </Text>
          )}
        </View>

        {(tempoPreparo || rendimento) && (
          <View style={styles.informacoesTempo}>
            {tempoPreparo && (
              <View style={styles.itemTempo}>
                <Text style={styles.labelTempo}>
                  Tempo de preparo
                </Text>

                <Text style={styles.valorTempo}>
                  {String(tempoPreparo)}
                </Text>
              </View>
            )}

            {rendimento && (
              <View style={styles.itemTempo}>
                <Text style={styles.labelTempo}>
                  Rendimento
                </Text>

                <Text style={styles.valorTempo}>
                  {String(rendimento)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>
            Ingredientes
          </Text>

          {ingredientes.length > 0 ? (
            ingredientes.map((ingrediente, index) => (
              <View
                key={`${index}-${typeof ingrediente === 'string' ? ingrediente : JSON.stringify(ingrediente)}`}
                style={styles.itemLista}
              >
                <View style={styles.marcador} />

                <Text style={styles.textoLista}>
                  {typeof ingrediente === 'string'
                    ? ingrediente
                    : String(
                        ingrediente?.nome ||
                          ingrediente?.ingrediente ||
                          ingrediente?.descricao ||
                          ''
                      )}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoVazio}>
              Os ingredientes não estão disponíveis nesta
              demonstração.
            </Text>
          )}
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>
            Modo de preparo
          </Text>

          {modoPreparo.length > 0 ? (
            modoPreparo.map((passo, index) => (
              <View key={index} style={styles.passo}>
                <View style={styles.numeroPasso}>
                  <Text style={styles.textoNumeroPasso}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.textoPasso}>
                  {String(
                    typeof passo === 'object'
                      ? passo?.descricao || passo?.texto || ''
                      : passo
                  ).replace(/^\d+[.)]\s*/, '')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoVazio}>
              O modo de preparo ainda não está disponível nesta
              demonstração.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.botaoVoltarReceitas}
          onPress={voltar}
          activeOpacity={0.8}
        >
          <Text style={styles.textoBotao}>
            Voltar para receitas
          </Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>
          Safe Bite — Alimentação com mais segurança.
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
    fontSize: 16,
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

  imagem: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
  },

  imagemPlaceholder: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iniciais: {
    fontSize: 42,
    fontWeight: '800',
    color: '#B77912',
  },

  introducao: {
    marginTop: 22,
    marginBottom: 20,
  },

  tituloReceita: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
  },

  descricao: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },

  aviso: {
    backgroundColor: '#FFF7E8',
    borderColor: '#F3D8A7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
  },

  avisoConflito: {
    backgroundColor: '#FDECEC',
    borderColor: '#E9A5A5',
  },

  avisoErro: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },

  tituloAviso: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A5A0A',
    marginBottom: 7,
  },

  tituloAvisoConflito: {
    color: '#A52222',
  },

  textoAviso: {
    fontSize: 12,
    lineHeight: 19,
    color: '#795D32',
  },

  conflitoItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1C5C5',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },

  textoConflito: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A52222',
    marginBottom: 4,
  },

  detalheConflito: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5F3030',
  },

  informacoesTempo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  itemTempo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
  },

  labelTempo: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 7,
  },

  valorTempo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262626',
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 16,
  },

  tituloSecao: {
    fontSize: 19,
    fontWeight: '800',
    color: '#262626',
    marginBottom: 18,
  },

  itemLista: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  marcador: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F5A623',
    marginTop: 7,
    marginRight: 11,
  },

  textoLista: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
  },

  passo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  numeroPasso: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  textoNumeroPasso: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B77912',
  },

  textoPasso: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    paddingTop: 4,
  },

  textoVazio: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  botaoVoltarReceitas: {
    backgroundColor: '#F5A623',
    minHeight: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  textoBotao: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  rodape: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 22,
  },
});
