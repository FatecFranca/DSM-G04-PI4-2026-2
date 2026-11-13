import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Carregando, Mensagem } from '../components/ui';
import { api } from '../api';
import { cores } from '../theme';
import { idDe } from '../utils';

export default function RestrictionsScreen() {
  const [todas, setTodas] = useState([]);
  const [associacoes, setAssociacoes] = useState({}); // restriction_id -> id da associação
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(null);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro('');

    try {
      const [disponiveis, doUsuario] = await Promise.all([
        api.listarRestricoes(),
        api.restricoesDoUsuario(),
      ]);

      const mapa = {};
      (doUsuario?.data || []).forEach((u) => {
        if (u.restriction_id) mapa[String(u.restriction_id)] = String(u.id);
      });

      setTodas(Array.isArray(disponiveis?.data) ? disponiveis.data : []);
      setAssociacoes(mapa);
    } catch (e) {
      if (!e.sessaoExpirada) setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function alternar(restricao) {
    const id = idDe(restricao);
    setOcupado(id);

    try {
      if (associacoes[id]) await api.removerRestricao(associacoes[id]);
      else await api.adicionarRestricao(id);

      await carregar(true);
    } catch (e) {
      if (!e.sessaoExpirada) Alert.alert('Não foi possível salvar', e.message);
    } finally {
      setOcupado(null);
    }
  }

  if (carregando) return <Carregando />;

  if (erro) {
    return (
      <Mensagem
        titulo="Não foi possível carregar"
        texto={erro}
        acao="Tentar novamente"
        onAcao={() => carregar()}
      />
    );
  }

  const selecionadas = Object.keys(associacoes).length;

  return (
    <View style={s.tela}>
      <FlatList
        data={todas}
        keyExtractor={(item, i) => `${idDe(item)}-${i}`}
        contentContainerStyle={s.lista}
        ListHeaderComponent={
          <View style={s.intro}>
            <Text style={s.introTitulo}>Suas restrições alimentares</Text>
            <Text style={s.introTexto}>
              Marque o que você precisa evitar. O app avisa quando uma receita tiver ingredientes
              relacionados.
            </Text>
            <Text style={s.contador}>
              {selecionadas} {selecionadas === 1 ? 'selecionada' : 'selecionadas'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Mensagem titulo="Nenhuma restrição cadastrada no sistema" />
        }
        renderItem={({ item }) => {
          const id = idDe(item);
          const marcada = !!associacoes[id];

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={ocupado !== null}
              onPress={() => alternar(item)}
              style={[s.item, marcada && s.itemMarcado, ocupado === id && { opacity: 0.6 }]}
            >
              <View style={[s.caixa, marcada && s.caixaMarcada]}>
                {marcada ? <Text style={s.check}>✓</Text> : null}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.nome}>{item.nome}</Text>
                {!!item.categoria && <Text style={s.categoria}>{item.categoria}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <Text style={s.aviso}>
            Esta seleção é informativa e não substitui a leitura dos rótulos, a verificação de
            contaminação cruzada ou a orientação de um profissional de saúde.
          </Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: 16, paddingBottom: 40 },
  intro: { backgroundColor: cores.suave, borderRadius: 14, padding: 16, marginBottom: 16 },
  introTitulo: { fontSize: 18, fontWeight: '800', color: cores.texto },
  introTexto: { fontSize: 13, color: cores.mudo, marginTop: 6, lineHeight: 19 },
  contador: { fontSize: 13, fontWeight: '700', color: cores.primariaEscura, marginTop: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemMarcado: { borderColor: cores.verde, backgroundColor: cores.verdeSuave },
  caixa: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  caixaMarcada: { backgroundColor: cores.verde, borderColor: cores.verde },
  check: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  nome: { fontSize: 14, fontWeight: '700', color: cores.texto },
  categoria: { fontSize: 12, color: cores.mudo, marginTop: 3 },
  aviso: { fontSize: 11, color: cores.mudo, lineHeight: 17, marginTop: 8 },
});
