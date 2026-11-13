import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';
import { Carregando, Mensagem } from '../components/ui';
import { api } from '../api';
import { cores } from '../theme';
import { idDe } from '../utils';

export default function MyRecipesScreen({ navigation }) {
  const [receitas, setReceitas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(null);

  const carregar = useCallback(async (puxar = false) => {
    if (puxar) setAtualizando(true);
    else setCarregando(true);
    setErro('');

    try {
      const resp = await api.minhasReceitas();
      setReceitas(Array.isArray(resp?.data) ? resp.data : []);
    } catch (e) {
      if (!e.sessaoExpirada) setErro(e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function confirmarExclusao(receita) {
    Alert.alert(
      'Excluir receita',
      `Deseja excluir "${receita.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluir(receita) },
      ]
    );
  }

  async function excluir(receita) {
    const id = idDe(receita);
    setExcluindo(id);

    try {
      await api.excluirReceita(id);
      setReceitas((atuais) => atuais.filter((r) => idDe(r) !== id));
    } catch (e) {
      if (!e.sessaoExpirada) Alert.alert('Não foi possível excluir', e.message);
    } finally {
      setExcluindo(null);
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

  return (
    <View style={s.tela}>
      <FlatList
        data={receitas}
        keyExtractor={(item, i) => `${idDe(item)}-${i}`}
        contentContainerStyle={s.lista}
        refreshing={atualizando}
        onRefresh={() => carregar(true)}
        ListEmptyComponent={
          <Mensagem
            titulo="Você ainda não tem receitas"
            texto="Toque no botão abaixo para criar a primeira."
            acao="Nova receita"
            onAcao={() => navigation.navigate('RecipeForm')}
          />
        }
        renderItem={({ item }) => {
          const publicada = item.status === 'publicada';
          const id = idDe(item);

          return (
            <RecipeCard
              receita={item}
              onPress={() => navigation.navigate('RecipeDetail', { id })}
              rodape={
                <View style={s.rodape}>
                  <View style={[s.status, publicada ? s.statusOk : s.statusRascunho]}>
                    <Text style={[s.statusTexto, { color: publicada ? '#15803D' : cores.primariaEscura }]}>
                      {publicada ? 'Publicada' : 'Rascunho'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => confirmarExclusao(item)}
                    disabled={excluindo !== null}
                    style={{ opacity: excluindo === id ? 0.5 : 1 }}
                  >
                    <Text style={s.excluir}>{excluindo === id ? 'Excluindo...' : 'Excluir'}</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: 16, paddingBottom: 40 },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  status: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusOk: { backgroundColor: '#E7F6EC' },
  statusRascunho: { backgroundColor: cores.suave },
  statusTexto: { fontSize: 11, fontWeight: '700' },
  excluir: { color: cores.perigo, fontWeight: '700', fontSize: 13 },
});
