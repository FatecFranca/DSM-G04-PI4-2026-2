import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from './theme';

// ---------- Cartão com título ----------
export function Cartao({ titulo, children, borda }) {
  const t = useTema();
  return (
    <View style={[s.cartao, { backgroundColor: t.cartao, borderColor: borda || t.borda }]}>
      {titulo ? <Text style={[s.cartaoTitulo, { color: t.mudo }]}>{titulo.toUpperCase()}</Text> : null}
      {children}
    </View>
  );
}

// ---------- Pílula de status (no cabeçalho) ----------
export function Pilula({ rotulo, cor }) {
  return (
    <View style={s.pilula}>
      <View style={[s.pilulaPonto, { backgroundColor: cor }]} />
      <Text style={s.pilulaTexto}>{rotulo}</Text>
    </View>
  );
}

// ---------- Barra de progresso com marcador de limite opcional ----------
// fracao e marcador vão de 0 a 1
export function Barra({ fracao, cor, marcador }) {
  const t = useTema();
  const f = Math.min(1, Math.max(0, fracao || 0));
  return (
    <View style={s.barraBox}>
      <View style={[s.barraTrilho, { backgroundColor: t.trilho }]}>
        <View style={[s.barraPreench, { width: `${f * 100}%`, backgroundColor: cor }]} />
      </View>
      {marcador !== null && marcador !== undefined ? (
        <View
          style={[s.marcador, { left: `${Math.min(1, Math.max(0, marcador)) * 100}%`, backgroundColor: t.texto }]}
        />
      ) : null}
    </View>
  );
}

// ---------- Mini gráfico de barras (histórico) ----------
export function Grafico({ dados, cor, altura = 56 }) {
  const t = useTema();
  const base = { height: altura, backgroundColor: t.cartao2, borderColor: t.borda };
  if (!dados || dados.length < 2) {
    return (
      <View style={[s.graficoVazio, base]}>
        <Text style={{ color: t.mudo, fontSize: 12 }}>Aguardando dados…</Text>
      </View>
    );
  }
  const min = Math.min(...dados);
  const max = Math.max(...dados);
  const faixa = max - min || 1;
  return (
    <View style={[s.grafico, base]}>
      {dados.map((v, i) => (
        <View key={i} style={s.graficoColuna}>
          <View
            style={{
              height: 4 + ((v - min) / faixa) * (altura - 14),
              backgroundColor: cor,
              borderRadius: 2,
              opacity: 0.35 + 0.65 * (i / (dados.length - 1)),
            }}
          />
        </View>
      ))}
    </View>
  );
}

// ---------- Seletor (alimento) ----------
export function Segmentado({ opcoes, valor, onChange }) {
  const t = useTema();
  return (
    <View style={s.segmentado}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            style={({ pressed }) => [
              s.segItem,
              {
                backgroundColor: ativo ? t.primaria : t.cartao2,
                borderColor: ativo ? t.primaria : t.borda,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={s.segEmoji}>{o.emoji}</Text>
            <Text style={[s.segRotulo, { color: ativo ? '#ffffff' : t.texto }]}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Botão ----------
// variante: 'primario' | 'perigo' | 'neutro'
export function Botao({ rotulo, onPress, variante = 'neutro', style }) {
  const t = useTema();
  const cores = {
    primario: { fundo: t.primaria, borda: t.primaria, texto: '#ffffff' },
    perigo: { fundo: 'transparent', borda: t.perigo, texto: t.perigo },
    neutro: { fundo: t.cartao2, borda: t.borda, texto: t.texto },
  }[variante];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.botao,
        variante === 'primario' && s.botaoGrande,
        { backgroundColor: cores.fundo, borderColor: cores.borda, opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[s.botaoTexto, variante === 'primario' && s.botaoTextoGrande, { color: cores.texto }]}>{rotulo}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cartao: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cartaoTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  pilula: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pilulaPonto: { width: 9, height: 9, borderRadius: 5 },
  pilulaTexto: { color: '#ffffff', fontSize: 12.5, fontWeight: '600' },

  barraBox: { height: 22, justifyContent: 'center' },
  barraTrilho: { height: 14, borderRadius: 7, overflow: 'hidden' },
  barraPreench: { height: '100%', borderRadius: 7 },
  marcador: { position: 'absolute', top: 0, width: 2, height: 22, borderRadius: 1, opacity: 0.8 },

  grafico: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 5 },
  graficoColuna: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 0.5 },
  graficoVazio: { borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  segmentado: { flexDirection: 'row', gap: 8 },
  segItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  segEmoji: { fontSize: 26 },
  segRotulo: { fontSize: 14, fontWeight: '700' },

  botao: { alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  botaoGrande: { paddingVertical: 14 },
  botaoTexto: { fontSize: 14.5, fontWeight: '700' },
  botaoTextoGrande: { fontSize: 16 },
});
