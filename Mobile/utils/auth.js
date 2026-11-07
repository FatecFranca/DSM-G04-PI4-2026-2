import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'safebite_token';
const USER_KEY = 'safebite_user';

export async function salvarAutenticacao(token, usuario = null) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);

    if (usuario) {
      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(usuario)
      );
    }

    return true;
  } catch (error) {
    console.log('Erro ao salvar autenticação:', error);
    return false;
  }
}

export async function obterToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log('Erro ao obter token:', error);
    return null;
  }
}

export async function obterUsuario() {
  try {
    const usuario = await AsyncStorage.getItem(USER_KEY);

    if (!usuario) {
      return null;
    }

    return JSON.parse(usuario);
  } catch (error) {
    console.log('Erro ao obter usuário:', error);
    return null;
  }
}

export async function estaAutenticado() {
  const token = await obterToken();

  return !!token;
}

export async function sair() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);

    return true;
  } catch (error) {
    console.log('Erro ao sair:', error);
    return false;
  }
}