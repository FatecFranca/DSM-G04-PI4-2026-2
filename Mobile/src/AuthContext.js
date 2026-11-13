import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, definirAoExpirarSessao } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Se o token não puder mais ser renovado, volta para a tela de login.
    definirAoExpirarSessao(() => setUsuario(null));

    api
      .sessaoSalva()
      .then(setUsuario)
      .finally(() => setCarregando(false));
  }, []);

  const valor = {
    carregando,
    usuario,
    entrar: async (email, senha) => setUsuario(await api.login(email, senha)),
    cadastrar: async (dados) => setUsuario(await api.cadastrar(dados)),
    sair: async () => {
      await api.sair();
      setUsuario(null);
    },
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
