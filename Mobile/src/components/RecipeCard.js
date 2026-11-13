import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cores } from '../theme';
import { urlImagem } from '../api';
import { iniciais } from '../utils';

export default function RecipeCard({ receita, conflitos = [], onPress, rodape }) {
  const foto = urlImagem(receita.imagem_url);
  const autor = receita.author?.nome_completo;
  const nota = Number(receita.averageRating) || 0;

  const meta = [autor, receita.tempo_preparo, nota > 0 ? `★ ${nota.toFixed(1)}` : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={s.card}>
      <View style={s.linha}>
        {foto ? (
          <Image source={{ uri: foto }} style={s.foto} resizeMode="cover" />
        ) : (
          <View style={[s.foto, s.semFoto]}>
            <Text style={s.iniciais}>{iniciais(receita.nome)}</Text>
          </View>
        )}

        <View style={s.info}>
          <Text style={s.titulo} numberOfLines={2}>
            {receita.nome || 'Receita sem título'}
          </Text>

          {!!receita.descricao && (
            <Text style={s.descricao} numberOfLines={2}>
              {receita.descricao}
            </Text>
          )}

          {!!meta && (
            <Text style={s.meta} numberOfLines={1}>
              {meta}
            </Text>
          )}

          {conflitos.length > 0 && (
            <View style={s.selo}>
              <Text style={s.seloTexto}>Possível conflito: {conflitos.join(', ')}</Text>
            </View>
          )}
        </View>
      </View>

      {rodape}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  linha: { flexDirection: 'row' },
  foto: { width: 96, height: 96, borderRadius: 10, backgroundColor: '#EEEEEE' },
  semFoto: { backgroundColor: cores.suave, alignItems: 'center', justifyContent: 'center' },
  iniciais: { color: cores.primariaEscura, fontSize: 24, fontWeight: '800' },
  info: { flex: 1, marginLeft: 12 },
  titulo: { fontSize: 15, fontWeight: '700', color: cores.texto },
  descricao: { fontSize: 12, color: cores.mudo, marginTop: 4, lineHeight: 17 },
  meta: { fontSize: 11, color: cores.mudo, marginTop: 6 },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: cores.perigoFundo,
    borderWidth: 1,
    borderColor: cores.perigoBorda,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
  },
  seloTexto: { color: '#B42318', fontSize: 11, fontWeight: '700' },
});
