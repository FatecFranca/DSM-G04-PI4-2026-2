
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useTema } from '../theme/theme';

export function Cartao({ titulo, children, borda }) {
  const t = useTema();

  return (
    <View
      style={[
        styles.cartao,
        {
          backgroundColor: t.cartao,
          borderColor: borda || t.borda,
        },
      ]}
    >
      {titulo ? (
        <Text style={[styles.titulo, { color: t.texto }]}>
          {titulo}
        </Text>
      ) : null}

      <View style={styles.conteudo}>
        {children}
      </View>
    </View>
  );
}

export function Pilula({ rotulo, cor }) {
  return (
    <View
      style={[
        styles.pilula,
        { backgroundColor: `${cor}22`, borderColor: cor },
      ]}
    >
      <View style={[styles.indicador, { backgroundColor: cor }]} />

      <Text style={[styles.pilulaTexto, { color: cor }]}>
        {rotulo}
      </Text>
    </View>
  );
}

export function Barra({ fracao, cor, marcador }) {
  const t = useTema();

  const percentual = Math.max(0, Math.min(1, Number(fracao) || 0));

  return (
    <View style={[styles.trilho, { backgroundColor: t.trilho }]}>
      <View
        style={[
          styles.preenchimento,
          {
            width: `${percentual * 100}%`,
            backgroundColor: cor || t.primaria,
          },
        ]}
      />
    </View>
  );
}

export function Grafico({ dados = [], cor, altura = 56 }) {
  const t = useTema();

  if (!dados.length) {
    return (
      <View
        style={[
          styles.graficoVazio,
          { height: altura, borderColor: t.borda },
        ]}
      >
        <Text style={{ color: t.mudo, fontSize: 12 }}>
          Aguardando leituras
        </Text>
      </View>
    );
  }

  const valores = dados.filter(v => Number.isFinite(Number(v)));
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const diferenca = maximo - minimo || 1;

  return (
    <View style={[styles.grafico, { height: altura }]}>
      {valores.map((valor, index) => {
        const tamanho = 12 + ((valor - minimo) / diferenca) * 88;

        return (
          <View
            key={index}
            style={[
              styles.graficoBarra,
              {
                height: `${tamanho}%`,
                backgroundColor: cor || t.primaria,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function Segmentado({ opcoes = [], valor, onChange }) {
  const t = useTema();

  return (
    <View style={styles.segmentado}>
      {opcoes.map(opcao => {
        const selecionado = valor === opcao.valor;

        return (
          <TouchableOpacity
            key={opcao.valor}
            activeOpacity={0.7}
            onPress={() => onChange(opcao.valor)}
            style={[
              styles.opcao,
              {
                backgroundColor: selecionado
                  ? t.primariaSuave
                  : t.cartao2,
                borderColor: selecionado
                  ? t.primaria
                  : t.borda,
              },
            ]}
          >
            <Text
              style={{
                color: selecionado ? t.primaria : t.texto,
                fontWeight: selecionado ? 'bold' : '500',
              }}
            >
              {opcao.rotulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Botao({
  rotulo,
  onPress,
  variante = 'neutro',
  style,
}) {
  const t = useTema();

  const cores = {
    primario: {
      fundo: t.primaria,
      texto: '#FFFFFF',
    },
    perigo: {
      fundo: t.perigo,
      texto: '#FFFFFF',
    },
    neutro: {
      fundo: t.cartao2,
      texto: t.texto,
    },
  };

  const cor = cores[variante] || cores.neutro;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.botao,
        {
          backgroundColor: cor.fundo,
          borderColor: t.borda,
        },
        style,
      ]}
    >
      <Text style={[styles.botaoTexto, { color: cor.texto }]}>
        {rotulo}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },

  titulo: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  conteudo: {
    gap: 12,
  },

  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },

  indicador: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  pilulaTexto: {
    fontSize: 12,
    fontWeight: '600',
  },

  trilho: {
    height: 9,
    borderRadius: 10,
    overflow: 'hidden',
  },

  preenchimento: {
    height: '100%',
    borderRadius: 10,
  },

  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    overflow: 'hidden',
  },

  graficoBarra: {
    flex: 1,
    minWidth: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  graficoVazio: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentado: {
    flexDirection: 'row',
    gap: 8,
  },

  opcao: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },

  botao: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
  },

  botaoTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
});
