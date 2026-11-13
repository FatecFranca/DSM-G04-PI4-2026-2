import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';
import { Carregando, Mensagem } from '../components/ui';
import { api } from '../api';
import { cores } from '../theme';
import { conflitosDaReceita, idDe, idsDasRestricoes } from '../utils';

export default function RecipesScreen({ navigation }) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [compativel, setCompativel] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [idsRestricoes, setIdsRestricoes] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  // Espera o usuário parar de digitar antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(
    async (puxar = false) => {
      if (puxar) setAtualizando(true);
      else setCarregando(true);
      setErro('');

      try {
        const [resp, minhas] = await Promise.all([
          api.listarReceitas({ search: termo, compatible: compativel }),
          api.restricoesDoUsuario().catch(() => null),
        ]);

        setReceitas(Array.isArray(resp?.data) ? resp.data : []);
        setIdsRestricoes(idsDasRestricoes(minhas));
      } catch (e) {
        if (!e.sessaoExpirada) setErro(e.message);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [termo, compativel]
  );

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return (
    <View style={s.tela}>
      <View style={s.topo}>
        <TextInput
          style={s.busca}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar receita pelo nome"
          placeholderTextColor={cores.mudo}
          returnKeyType="search"
          autoCapitalize="none"
        />

        <View style={s.filtro}>
          <Text style={s.filtroTexto}>Só receitas compatíveis com minhas restrições</Text>
          <Switch
            value={compativel}
            onValueChange={setCompativel}
            trackColor={{ true: cores.primaria }}
          />
        </View>
      </View>

      {carregando ? (
        <Carregando texto="Carregando receitas..." />
      ) : erro ? (
        <Mensagem
          titulo="Não foi possível carregar"
          texto={erro}
          acao="Tentar novamente"
          onAcao={() => carregar()}
        />
      ) : (
        <FlatList
          data={receitas}
          keyExtractor={(item, i) => `${idDe(item)}-${i}`}
          contentContainerStyle={s.lista}
          refreshing={atualizando}
          onRefresh={() => carregar(true)}
          ListEmptyComponent={
            <Mensagem
              titulo="Nenhuma receita encontrada"
              texto={
                compativel
                  ? 'Nenhuma receita compatível com as suas restrições.'
                  : 'Tente outro nome ou publique a primeira receita.'
              }
            />
          }
          renderItem={({ item }) => (
            <RecipeCard
              receita={item}
              conflitos={conflitosDaReceita(item, idsRestricoes)}
              onPress={() => navigation.navigate('RecipeDetail', { id: idDe(item) })}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RecipeForm')}
        accessibilityLabel="Nova receita"
      >
        <Text style={s.fabTexto}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { padding: 16, paddingBottom: 8 },
  busca: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: cores.texto,
  },
  filtro: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  filtroTexto: { flex: 1, fontSize: 12, color: cores.mudo, marginRight: 8 },
  lista: { padding: 16, paddingBottom: 90 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabTexto: { color: '#FFFFFF', fontSize: 30, lineHeight: 34 },
});
