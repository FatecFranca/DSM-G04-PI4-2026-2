import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Botao } from '../components/ui';
import { useAuth } from '../AuthContext';
import { api, urlImagem } from '../api';
import { SERVER_URL } from '../config';
import { cores } from '../theme';
import { iniciais } from '../utils';

export default function ProfileScreen({ navigation }) {
  const { usuario, sair } = useAuth();
  const [perfil, setPerfil] = useState(usuario || {});

  useFocusEffect(
    useCallback(() => {
      api
        .perfil()
        .then((resp) => {
          if (resp?.data?.user) setPerfil(resp.data.user);
        })
        .catch(() => {});
    }, [])
  );

  function confirmarSaida() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  const foto = urlImagem(perfil.foto_perfil);

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo}>
      <View style={s.cabecalho}>
        {foto ? (
          <Image source={{ uri: foto }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarVazio]}>
            <Text style={s.avatarTexto}>{iniciais(perfil.nome_completo)}</Text>
          </View>
        )}
        <Text style={s.nome}>{perfil.nome_completo || 'Usuário'}</Text>
        <Text style={s.email}>{perfil.email}</Text>
      </View>

      <View style={s.cartao}>
        <Linha rotulo="Telefone" valor={perfil.telefone} />
        <Linha rotulo="Idade" valor={perfil.idade ? `${perfil.idade} anos` : null} />
        <Linha rotulo="E-mail verificado" valor={perfil.email_verificado ? 'Sim' : 'Não'} />
      </View>

      <Botao
        titulo="Dashboard alimentar"
        variante="secundario"
        onPress={() => navigation.navigate('Dashboard')}
        style={{ marginBottom: 12 }}
      />

      <Botao titulo="Sair da conta" variante="perigo" onPress={confirmarSaida} />

      <Text style={s.servidor}>Servidor: {SERVER_URL}</Text>
    </ScrollView>
  );
}

function Linha({ rotulo, valor }) {
  return (
    <View style={s.linha}>
      <Text style={s.linhaRotulo}>{rotulo}</Text>
      <Text style={s.linhaValor}>{valor || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20 },
  cabecalho: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EEEEEE' },
  avatarVazio: { backgroundColor: cores.suave, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontSize: 30, fontWeight: '800', color: cores.primariaEscura },
  nome: { fontSize: 20, fontWeight: '800', color: cores.texto, marginTop: 12 },
  email: { fontSize: 13, color: cores.mudo, marginTop: 4 },
  cartao: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linhaRotulo: { fontSize: 13, color: cores.mudo },
  linhaValor: { fontSize: 13, fontWeight: '600', color: cores.texto },
  servidor: { fontSize: 11, color: cores.mudo, textAlign: 'center', marginTop: 24 },
});
