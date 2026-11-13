import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const VERDE = '#15966A';
const LARANJA = '#DE8B37';
const CINZA = '#94A3B8';
const ALTURA = 190;
const TOPO = 10;
const BASE = 166;
const ESQUERDA = 42;
const DIREITA = 12;

// Linhas em Views nativas: sem WebView nem dependência de bibliotecas de gráficos.
function Traco({ x1, y1, x2, y2, cor = VERDE, espessura = 2, tracejado = false }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distancia = Math.sqrt(dx * dx + dy * dy);
  if (!distancia || !Number.isFinite(distancia)) return null;
  const angulo = Math.atan2(dy, dx) * 180 / Math.PI;
  const numeroSegmentos = tracejado ? Math.max(1, Math.ceil(distancia / 10)) : 1;
  return (
    <>
      {Array.from({ length: numeroSegmentos }, (_, i) => {
        if (tracejado && i % 2) return null;
        const proporcaoInicial = i / numeroSegmentos;
        const proporcaoFinal = (i + 1) / numeroSegmentos;
        const xi = x1 + dx * proporcaoInicial;
        const yi = y1 + dy * proporcaoInicial;
        const xf = x1 + dx * proporcaoFinal;
        const yf = y1 + dy * proporcaoFinal;
        const comprimento = Math.hypot(xf - xi, yf - yi);
        return (
          <View key={i} style={{
            position: 'absolute',
            left: (xi + xf) / 2 - comprimento / 2,
            top: (yi + yf) / 2 - espessura / 2,
            width: comprimento,
            height: espessura,
            backgroundColor: cor,
            borderRadius: 5,
            transform: [{ rotate: `${angulo}deg` }],
          }} />
        );
      })}
    </>
  );
}

function Eixos({ largura, maximo }) {
  const w = largura - ESQUERDA - DIREITA;
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const y = TOPO + (BASE - TOPO) * i / 4;
        return (
          <React.Fragment key={i}>
            <View style={{ position: 'absolute', left: ESQUERDA, top: y, width: w, height: 1, backgroundColor: '#E6EEEB' }} />
            <Text style={[styles.rotuloEixo, { top: y - 7 }]}>
              {Math.round(maximo * (1 - i / 4)).toLocaleString('pt-BR')}
            </Text>
          </React.Fragment>
        );
      })}
    </>
  );
}

function CorpoGrafico({ children, legendaEsquerda, legendaDireita, maximo }) {
  const [largura, setLargura] = useState(0);
  return (
    <View
      style={styles.caixaGrafico}
      onLayout={evento => setLargura(evento.nativeEvent.layout.width)}
      accessibilityLabel="Gráfico estatístico"
    >
      {largura > ESQUERDA + DIREITA + 30 ? (
        <>
          <Eixos largura={largura} maximo={maximo} />
          {children(largura)}
          <Text style={[styles.legendaEixo, { left: ESQUERDA }]} numberOfLines={1}>{legendaEsquerda}</Text>
          <Text style={[styles.legendaEixo, { right: DIREITA, textAlign: 'right' }]} numberOfLines={1}>{legendaDireita}</Text>
        </>
      ) : null}
    </View>
  );
}

function vazio() {
  return <Text style={styles.vazio}>Sem registros para exibir neste período.</Text>;
}

export function ConsumoDiarioChart({ dias, meta }) {
  if (!dias.length) return vazio();
  const maximo = Math.max(meta, ...dias.map(d => d.kcal), 1) * 1.1;
  const passo = Math.max(1, Math.ceil(dias.length / 85));
  const pontos = dias.filter((_, indice) => indice % passo === 0);
  if (pontos[pontos.length - 1] !== dias[dias.length - 1]) pontos.push(dias[dias.length - 1]);
  return (
    <CorpoGrafico
      maximo={maximo}
      legendaEsquerda={dias[0].data.slice(5)}
      legendaDireita={dias[dias.length - 1].data.slice(5)}
    >
      {largura => {
        const w = largura - ESQUERDA - DIREITA;
        const x = indice => ESQUERDA + indice / Math.max(pontos.length - 1, 1) * w;
        const y = valor => BASE - valor / maximo * (BASE - TOPO);
        return (
          <>
            <Traco x1={ESQUERDA} x2={largura - DIREITA} y1={y(meta)} y2={y(meta)} cor={LARANJA} tracejado />
            {pontos.slice(1).map((ponto, i) => (
              <Traco key={i} x1={x(i)} y1={y(pontos[i].kcal)} x2={x(i + 1)} y2={y(ponto.kcal)} />
            ))}
          </>
        );
      }}
    </CorpoGrafico>
  );
}

export function DistribuicaoNormalChart({ analise }) {
  if (!analise.quantidade) return vazio();
  const { histograma, curvaNormal, minimo, maximo } = analise;
  const limite = Math.max(1, ...histograma, ...curvaNormal) * 1.12;
  return (
    <CorpoGrafico
      maximo={limite}
      legendaEsquerda={`${Math.round(minimo)} kcal`}
      legendaDireita={`${Math.round(maximo)} kcal`}
    >
      {largura => {
        const w = largura - ESQUERDA - DIREITA;
        const coluna = w / histograma.length;
        const y = valor => BASE - valor / limite * (BASE - TOPO);
        return (
          <>
            {histograma.map((valor, i) => (
              <View key={i} style={{
                position: 'absolute',
                left: ESQUERDA + i * coluna + 1,
                top: y(valor),
                width: Math.max(1, coluna - 2),
                height: BASE - y(valor),
                backgroundColor: '#7FD8B9',
              }} />
            ))}
            {curvaNormal.slice(1).map((valor, i) => (
              <Traco key={i} x1={ESQUERDA + i / (curvaNormal.length - 1) * w} y1={y(curvaNormal[i])}
                x2={ESQUERDA + (i + 1) / (curvaNormal.length - 1) * w} y2={y(valor)} cor={LARANJA} />
            ))}
          </>
        );
      }}
    </CorpoGrafico>
  );
}

export function CorrelacaoChart({ registros, modelo }) {
  if (!registros.length) return vazio();
  const minimoX = Math.min(...registros.map(item => item.peso));
  const maximoX = Math.max(...registros.map(item => item.peso));
  const maximoY = Math.max(1, ...registros.map(item => item.calorias)) * 1.1;
  const salto = Math.max(1, Math.ceil(registros.length / 120));
  const amostra = registros.filter((_, i) => i % salto === 0);
  return (
    <CorpoGrafico maximo={maximoY} legendaEsquerda={`${minimoX} g`} legendaDireita={`${maximoX} g`}>
      {largura => {
        const w = largura - ESQUERDA - DIREITA;
        const x = peso => ESQUERDA + (peso - minimoX) / (maximoX - minimoX || 1) * w;
        const y = kcal => BASE - kcal / maximoY * (BASE - TOPO);
        return (
          <>
            {amostra.map((item, i) => (
              <View key={i} style={{
                position: 'absolute',
                left: x(item.peso) - 2,
                top: y(item.calorias) - 2,
                width: 4,
                height: 4,
                borderRadius: 3,
                backgroundColor: '#15966A77',
              }} />
            ))}
            <Traco x1={x(minimoX)} y1={y(modelo.a + modelo.b * minimoX)}
              x2={x(maximoX)} y2={y(modelo.a + modelo.b * maximoX)} cor={LARANJA} espessura={2.5} />
          </>
        );
      }}
    </CorpoGrafico>
  );
}

const styles = StyleSheet.create({
  caixaGrafico: { width: '100%', height: ALTURA, overflow: 'hidden' },
  rotuloEixo: { position: 'absolute', left: 0, width: ESQUERDA - 6, textAlign: 'right', color: '#718096', fontSize: 10 },
  legendaEixo: { position: 'absolute', bottom: 0, maxWidth: '42%', color: CINZA, fontSize: 11 },
  vazio: { textAlign: 'center', paddingVertical: 42, color: CINZA },
});