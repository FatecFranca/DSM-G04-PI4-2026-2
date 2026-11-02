
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../services/api';

export default function ReceitaFormularioScreen({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ingredientes, setIngredientes] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [rendimento, setRendimento] = useState('');
  const [imagens, setImagens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  async function selecionarImagens() {
    if (imagens.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode selecionar até 5 imagens.');
      return;
    }

    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria para selecionar imagens.'
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - imagens.length,
        quality: 0.8,
      });

      if (!resultado.canceled) {
        const novasImagens = resultado.assets.map((item) => item.uri);

        setImagens((anteriores) =>
          [...anteriores, ...novasImagens]
            .filter((uri, index, lista) => lista.indexOf(uri) === index)
            .slice(0, 5)
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a galeria de imagens.');
    }
  }

  function removerImagem(uri) {
    setImagens((anteriores) =>
      anteriores.filter((imagem) => imagem !== uri)
    );
  }

  function validarFormulario() {
    if (titulo.trim().length < 3) {
      Alert.alert(
        'Título inválido',
        'Informe um nome com pelo menos 3 caracteres.'
      );
      return false;
    }

    if (titulo.trim().length > 255) {
      Alert.alert(
        'Título muito longo',
        'O título deve ter no máximo 255 caracteres.'
      );
      return false;
    }

    if (descricao.trim().length > 1000) {
      Alert.alert(
        'Descrição muito longa',
        'A descrição deve ter no máximo 1.000 caracteres.'
      );
      return false;
    }

    const listaIngredientes = ingredientes
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (listaIngredientes.length === 0) {
      Alert.alert(
        'Ingredientes obrigatórios',
        'Informe pelo menos um ingrediente, colocando um por linha.'
      );
      return false;
    }

    if (modoPreparo.trim().length < 10) {
      Alert.alert(
        'Modo de preparo',
        'Descreva o preparo com pelo menos 10 caracteres.'
      );
      return false;
    }

    if (tempoPreparo.trim().length > 50) {
      Alert.alert(
        'Tempo inválido',
        'O tempo de preparo deve ter no máximo 50 caracteres.'
      );
      return false;
    }

    if (rendimento.trim().length > 50) {
      Alert.alert(
        'Rendimento inválido',
        'O rendimento deve ter no máximo 50 caracteres.'
      );
      return false;
    }

    return true;
  }

  function prepararArquivoImagem(uri) {
    if (!uri) {
      return null;
    }

    const nomeArquivo = uri.split('/').pop() || 'receita.jpg';
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();

    const tiposMime = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    return {
      uri,
      name: nomeArquivo.includes('.') ? nomeArquivo : 'receita.jpg',
      type: tiposMime[extensao] || 'image/jpeg',
    };
  }

  async function salvarReceita(status = 'rascunho') {
    if (salvando) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);

    try {
      const listaIngredientes = ingredientes
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const dadosReceita = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        ingredientes: JSON.stringify(listaIngredientes),
        modo_preparo: modoPreparo.trim(),
        tempo_preparo: tempoPreparo.trim(),
        rendimento: rendimento.trim(),
        status,
      };

      // O backend aceita somente uma imagem no campo "image".
      const arquivoImagem = imagens.length > 0
        ? prepararArquivoImagem(imagens[0])
        : null;

      const resposta = await apiService.createRecipe(
        dadosReceita,
        arquivoImagem
      );

      if (!resposta?.success) {
        throw new Error(
          resposta?.message || 'Não foi possível cadastrar a receita.'
        );
      }

      Alert.alert(
        'Receita cadastrada',
        status === 'publicada'
          ? 'Sua receita foi publicada com sucesso!'
          : 'Sua receita foi salva como rascunho.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      let mensagem = error?.message ||
        'Ocorreu um erro ao salvar sua receita.';

      if (error?.status === 401 || error?.status === 403) {
        mensagem =
          'Sua sessão pode ter expirado ou você não está autenticado. ' +
          'Entre novamente no aplicativo e tente de novo.';
      } else if (error?.status === 400 && error?.data?.errors?.length) {
        mensagem = error.data.errors
          .map((item) => item.message)
          .join('\n');
      }

      Alert.alert('Não foi possível salvar', mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.cabecalho}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
          disabled={salvando}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.textoVoltar}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.tituloCabecalho}>Registrar receita</Text>

        <View style={styles.espacador} />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.tituloPagina}>Compartilhe seu prato</Text>

        <Text style={styles.subtitulo}>
          Preencha as informações para apresentar sua receita
          à comunidade Safe Bite.
        </Text>

        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>Segurança alimentar</Text>

          <Text style={styles.avisoTexto}>
            Informe os ingredientes corretamente. O Safe Bite tentará
            identificar possíveis restrições alimentares a partir deles.
          </Text>
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>Informações básicas</Text>

          <Text style={styles.label}>Nome da receita *</Text>

          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex.: Panqueca de banana"
            placeholderTextColor="#9CA3AF"
            maxLength={255}
            editable={!salvando}
          />

          <Text style={styles.label}>Descrição</Text>

          <TextInput
            style={[styles.input, styles.textAreaCurta]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Conte um pouco sobre o prato"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            editable={!salvando}
          />

          <Text style={styles.label}>Tempo de preparo</Text>

          <TextInput
            style={styles.input}
            value={tempoPreparo}
            onChangeText={setTempoPreparo}
            placeholder="Ex.: 30 minutos"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            editable={!salvando}
          />

          <Text style={styles.label}>Rendimento</Text>

          <TextInput
            style={styles.input}
            value={rendimento}
            onChangeText={setRendimento}
            placeholder="Ex.: 4 porções"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            editable={!salvando}
          />
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>Ingredientes</Text>

          <Text style={styles.instrucao}>
            Escreva um ingrediente por linha, incluindo as quantidades.
          </Text>

          <TextInput
            style={[styles.input, styles.textAreaGrande]}
            value={ingredientes}
            onChangeText={setIngredientes}
            placeholder={'2 bananas\n1 ovo\n4 colheres de aveia'}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            editable={!salvando}
          />
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>Modo de preparo</Text>

          <Text style={styles.instrucao}>
            Descreva as etapas na ordem em que devem ser realizadas.
          </Text>

          <TextInput
            style={[styles.input, styles.textAreaPreparo]}
            value={modoPreparo}
            onChangeText={setModoPreparo}
            placeholder={
              '1. Amasse as bananas.\n2. Misture os ingredientes.\n3. Prepare em uma frigideira.'
            }
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            editable={!salvando}
          />
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloSecao}>Imagens da receita</Text>

          <Text style={styles.instrucao}>
            Selecione até 5 imagens. Atualmente, somente a primeira será
            enviada ao servidor.
          </Text>

          <TouchableOpacity
            style={styles.botaoImagem}
            onPress={selecionarImagens}
            activeOpacity={0.8}
            disabled={salvando}
          >
            <Text style={styles.textoBotaoImagem}>
              Selecionar imagens ({imagens.length}/5)
            </Text>
          </TouchableOpacity>

          {imagens.length > 0 && (
            <View style={styles.gradeImagens}>
              {imagens.map((uri, index) => (
                <View key={uri} style={styles.itemImagem}>
                  <Image
                    source={{ uri }}
                    style={styles.previewImagem}
                  />

                  <TouchableOpacity
                    style={styles.botaoRemoverImagem}
                    onPress={() => removerImagem(uri)}
                    disabled={salvando}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover imagem ${index + 1}`}
                  >
                    <Text style={styles.textoRemoverImagem}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.botaoSalvar,
            salvando && styles.botaoDesabilitado,
          ]}
          onPress={() => salvarReceita('publicada')}
          activeOpacity={0.8}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotaoSalvar}>
              Publicar receita
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botaoRascunho,
            salvando && styles.botaoDesabilitado,
          ]}
          onPress={() => salvarReceita('rascunho')}
          activeOpacity={0.8}
          disabled={salvando}
        >
          <Text style={styles.textoBotaoRascunho}>
            Salvar como rascunho
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoCancelar}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          disabled={salvando}
        >
          <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>* Campos obrigatórios</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  cabecalho: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  botaoVoltar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoVoltar: {
    fontSize: 34,
    color: '#333333',
    lineHeight: 38,
  },

  tituloCabecalho: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  espacador: {
    width: 38,
  },

  conteudo: {
    padding: 18,
    paddingBottom: 40,
  },

  tituloPagina: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 8,
  },

  subtitulo: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },

  aviso: {
    backgroundColor: '#FFF7E8',
    borderColor: '#F3D8A7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
  },

  avisoTitulo: {
    color: '#8A5A0A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },

  avisoTexto: {
    color: '#795D32',
    fontSize: 12,
    lineHeight: 19,
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 17,
    marginBottom: 17,
  },

  tituloSecao: {
    color: '#222222',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 17,
  },

  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#262626',
    fontSize: 14,
    marginBottom: 17,
  },

  textAreaCurta: {
    minHeight: 90,
  },

  textAreaGrande: {
    minHeight: 150,
  },

  textAreaPreparo: {
    minHeight: 190,
  },

  instrucao: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 19,
    marginTop: -7,
    marginBottom: 14,
  },

  botaoImagem: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  textoBotaoImagem: {
    color: '#A66B0A',
    fontSize: 13,
    fontWeight: '700',
  },

  gradeImagens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },

  itemImagem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },

  previewImagem: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
  },

  botaoRemoverImagem: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoRemoverImagem: {
    color: '#DC2626',
    fontSize: 22,
    lineHeight: 24,
  },

  botaoSalvar: {
    minHeight: 51,
    borderRadius: 11,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  botaoRascunho: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  textoBotaoRascunho: {
    color: '#A66B0A',
    fontSize: 14,
    fontWeight: '700',
  },

  botaoCancelar: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  textoBotaoCancelar: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },

  rodape: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
