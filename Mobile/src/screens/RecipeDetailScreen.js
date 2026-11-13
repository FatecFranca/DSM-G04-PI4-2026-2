import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Carregando, Mensagem } from '../components/ui';
import { api, urlImagem } from '../api';
import { cores } from '../theme';
import { idsDasRestricoes, lista, montarAvisos } from '../utils';

export default function RecipeDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [receita, setReceita] = useState(null);
  const [idsRestricoes, setIdsRestricoes] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const [resp, minhas] = await Promise.all([
          api.obterReceita(id),
          api.restricoesDoUsuario().catch(() => null),
        ]);

        if (!ativo) return;

        setReceita(resp?.data || null);
        setIdsRestricoes(idsDasRestricoes(minhas));
        navigation.setOptions({ title: resp?.data?.nome || 'Receita' });
      } catch (e) {
        if (ativo && !e.sessaoExpirada) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [id, navigation]);

  if (carregando) return <Carregando />;
  if (erro || !receita) {
    return <Mensagem titulo="Não foi possível abrir a receita" texto={erro} />;
  }

  const foto = urlImagem(receita.imagem_url);
  const ingredientes = lista(receita.ingredientes);
  const avisos = montarAvisos(receita, idsRestricoes);
  const nota = Number(receita.averageRating) || 0;
  const avaliacoes = Array.isArray(receita.ratings) ? receita.ratings : [];

  const meta = [
    receita.author?.nome_completo ? `por ${receita.author.nome_completo}` : null,
    receita.tempo_preparo,
    receita.rendimento,
    nota > 0 ? `★ ${nota.toFixed(1)} (${receita.totalRatings})` : null,
  ].filter(Boolean);

  return (
    <ScrollView style={s.tela} contentContainerStyle={{ paddingBottom: 40 }}>
      {foto ? <Image source={{ uri: foto }} style={s.foto} resizeMode="cover" /> : null}

      <View style={s.corpo}>
        <Text style={s.titulo}>{receita.nome}</Text>
        {meta.length > 0 && <Text style={s.meta}>{meta.join(' • ')}</Text>}
        {!!receita.descricao && <Text style={s.descricao}>{receita.descricao}</Text>}

        {avisos.length > 0 && (
          <View style={s.aviso}>
            <Text style={s.avisoTitulo}>Possível conflito com suas restrições</Text>
            {avisos.map((a, i) => (
              <Text key={i} style={s.avisoTexto}>
                • {a}
              </Text>
            ))}
            <Text style={s.avisoRodape}>
              Esta checagem é um aviso e não substitui a leitura dos rótulos nem a orientação de
              um profissional de saúde.
            </Text>
          </View>
        )}

        <Text style={s.secao}>Ingredientes</Text>
        {ingredientes.length > 0 ? (
          ingredientes.map((item, i) => (
            <Text key={i} style={s.item}>
              • {item}
            </Text>
          ))
        ) : (
          <Text style={s.item}>Nenhum ingrediente informado.</Text>
        )}

        <Text style={s.secao}>Modo de preparo</Text>
        <Text style={s.texto}>{receita.modo_preparo || 'Não informado.'}</Text>

        <Text style={s.secao}>Avaliações</Text>
        {avaliacoes.length === 0 ? (
          <Text style={s.item}>Ainda não há avaliações.</Text>
        ) : (
          avaliacoes.slice(0, 10).map((a, i) => (
            <View key={a.id || i} style={s.avaliacao}>
              <Text style={s.avaliacaoNome}>
                {a.user?.nome_completo || 'Usuário'} — {'★'.repeat(Number(a.rating) || 0)}
              </Text>
              {!!a.comentario && <Text style={s.texto}>{a.comentario}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  foto: { width: '100%', height: 230, backgroundColor: '#EEEEEE' },
  corpo: { padding: 18 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  meta: { fontSize: 12, color: cores.mudo, marginTop: 6 },
  descricao: { fontSize: 14, color: cores.mudo, marginTop: 12, lineHeight: 21 },
  aviso: {
    backgroundColor: cores.perigoFundo,
    borderWidth: 1,
    borderColor: cores.perigoBorda,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  avisoTitulo: { color: '#B42318', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  avisoTexto: { color: '#7A271A', fontSize: 13, lineHeight: 20 },
  avisoRodape: { color: '#7A271A', fontSize: 11, marginTop: 8, lineHeight: 16 },
  secao: { fontSize: 17, fontWeight: '800', color: cores.texto, marginTop: 24, marginBottom: 8 },
  item: { fontSize: 14, color: cores.texto, lineHeight: 22 },
  texto: { fontSize: 14, color: cores.texto, lineHeight: 22 },
  avaliacao: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  avaliacaoNome: { fontSize: 12, fontWeight: '700', color: cores.primariaEscura, marginBottom: 4 },
});
