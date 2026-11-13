import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Botao, Campo } from '../components/ui';
import { api } from '../api';
import { cores } from '../theme';

export default function RecipeFormScreen({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ingredientesTexto, setIngredientesTexto] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [tempo, setTempo] = useState('');
  const [rendimento, setRendimento] = useState('');
  const [imagem, setImagem] = useState(null);
  const [salvando, setSalvando] = useState(null); // 'publicada' | 'rascunho' | null

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher a foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const arquivo = resultado.assets[0];
    setImagem({
      uri: arquivo.uri,
      name: arquivo.fileName || arquivo.uri.split('/').pop() || 'receita.jpg',
      type: arquivo.mimeType || 'image/jpeg',
    });
  }

  async function salvar(status) {
    const ingredientes = ingredientesTexto
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    if (!titulo.trim()) {
      Alert.alert('Atenção', 'Informe o nome da receita.');
      return;
    }
    if (ingredientes.length === 0) {
      Alert.alert('Atenção', 'Informe ao menos um ingrediente (um por linha).');
      return;
    }
    if (!modoPreparo.trim()) {
      Alert.alert('Atenção', 'Informe o modo de preparo.');
      return;
    }

    setSalvando(status);
    try {
      await api.criarReceita(
        {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          ingredientes: JSON.stringify(ingredientes),
          modo_preparo: modoPreparo.trim(),
          tempo_preparo: tempo.trim(),
          rendimento: rendimento.trim(),
          status,
        },
        imagem
      );

      Alert.alert(
        'Pronto!',
        status === 'publicada'
          ? 'Sua receita foi publicada.'
          : 'Sua receita foi salva como rascunho.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      if (!e.sessaoExpirada) Alert.alert('Não foi possível salvar', e.message);
    } finally {
      setSalvando(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        <Campo rotulo="Nome da receita *" value={titulo} onChangeText={setTitulo} />
        <Campo
          rotulo="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />
        <Campo
          rotulo="Ingredientes * (um por linha)"
          value={ingredientesTexto}
          onChangeText={setIngredientesTexto}
          multiline
          placeholder={'2 xícaras de farinha\n1 ovo\n200 ml de leite'}
        />
        <Campo
          rotulo="Modo de preparo *"
          value={modoPreparo}
          onChangeText={setModoPreparo}
          multiline
        />
        <Campo rotulo="Tempo de preparo" value={tempo} onChangeText={setTempo} placeholder="Ex.: 40 minutos" />
        <Campo rotulo="Rendimento" value={rendimento} onChangeText={setRendimento} placeholder="Ex.: 4 porções" />

        <Text style={s.rotulo}>Foto</Text>
        {imagem ? (
          <View style={{ marginBottom: 14 }}>
            <Image source={{ uri: imagem.uri }} style={s.preview} resizeMode="cover" />
            <Botao
              titulo="Remover foto"
              variante="perigo"
              onPress={() => setImagem(null)}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          <Botao
            titulo="Escolher foto da galeria"
            variante="secundario"
            onPress={escolherImagem}
            style={{ marginBottom: 14 }}
          />
        )}

        <Botao
          titulo="Publicar receita"
          onPress={() => salvar('publicada')}
          carregando={salvando === 'publicada'}
          desabilitado={salvando !== null}
        />
        <Botao
          titulo="Salvar como rascunho"
          variante="secundario"
          onPress={() => salvar('rascunho')}
          carregando={salvando === 'rascunho'}
          desabilitado={salvando !== null}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  conteudo: { padding: 20, paddingBottom: 40 },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  preview: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#EEEEEE' },
});
