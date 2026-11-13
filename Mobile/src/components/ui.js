import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { cores } from '../theme';

export function Botao({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
  style,
}) {
  const bloqueado = carregando || desabilitado;
  const secundario = variante === 'secundario';
  const perigo = variante === 'perigo';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={bloqueado}
      style={[
        s.botao,
        secundario && s.botaoSecundario,
        perigo && s.botaoPerigo,
        bloqueado && { opacity: 0.6 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={secundario || perigo ? cores.primaria : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            s.botaoTexto,
            secundario && { color: cores.texto },
            perigo && { color: cores.perigo },
          ]}
        >
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Campo({ rotulo, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <TextInput
        placeholderTextColor={cores.mudo}
        {...props}
        style={[s.input, props.multiline && s.inputMulti]}
      />
    </View>
  );
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <View style={s.centro}>
      <ActivityIndicator size="large" color={cores.primaria} />
      <Text style={s.centroTexto}>{texto}</Text>
    </View>
  );
}

export function Mensagem({ titulo, texto, acao, onAcao }) {
  return (
    <View style={s.centro}>
      <Text style={s.mensagemTitulo}>{titulo}</Text>
      {texto ? <Text style={s.centroTexto}>{texto}</Text> : null}
      {acao ? (
        <Botao titulo={acao} onPress={onAcao} style={{ marginTop: 16, alignSelf: 'center', paddingHorizontal: 24 }} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  botao: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.primaria,
  },
  botaoSecundario: { backgroundColor: cores.cartao, borderColor: cores.borda },
  botaoPerigo: { backgroundColor: cores.cartao, borderColor: cores.perigoBorda },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  input: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: cores.texto,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  centro: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  centroTexto: { color: cores.mudo, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  mensagemTitulo: { color: cores.texto, fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
