import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';

import { estaAutenticado } from '../utils/auth';

export default function ProtectedRoute({
  navigation,
  children,
}) {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    verificar();
  }, []);

  async function verificar() {
    const autenticado = await estaAutenticado();

    if (!autenticado) {
      navigation.replace('Login');
      return;
    }

    setAutorizado(true);
    setVerificando(false);
  }

  if (verificando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#F5A623"
        />
      </View>
    );
  }

  if (!autorizado) {
    return null;
  }

  return children;
}