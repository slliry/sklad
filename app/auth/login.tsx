import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Image, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    // Проверка разрешенных email
    const allowedEmails = ['admin@luxsclad.com','zusupov2050@gmail.com','ars.erg@icloud.com'];
    const isLuxScladEmail = email.endsWith('@luxsclad.com');
    const isAllowedEmail = allowedEmails.includes(email);

    if (!isLuxScladEmail && !isAllowedEmail) {
      setError('Доступ разрешен только для сотрудников LuxSclad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/orders');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Неверный формат email');
          break;
        case 'auth/user-not-found':
          setError('Пользователь не найден');
          break;
        case 'auth/wrong-password':
          setError('Неверный пароль');
          break;
        case 'auth/too-many-requests':
          setError('Слишком много попыток входа. Попробуйте позже');
          break;
        default:
          setError('Ошибка при входе. Попробуйте позже');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('./register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <RNView style={styles.logoBox}>
          <Image 
            source={require('../../assets/images/favicon.png')} 
            style={styles.logo}
          />
        </RNView>
      </View>

      <View style={styles.inputContainer}>
        <RNView style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Email или логин"
            value={email}
            onChangeText={(text) => {
              setEmail(text.trim());
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <Ionicons name="person-outline" size={24} color="#999" style={styles.inputIcon} />
        </RNView>

        <RNView style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Пароль"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.inputIcon}
            disabled={loading}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
              size={24} 
              color="#999" 
            />
          </TouchableOpacity>
        </RNView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Вход...' : 'Войти'}</Text>
        </TouchableOpacity>

        <RNView style={styles.registerContainer}>
          <Text style={styles.registerText}>Нет аккаунта? </Text>
          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <Text style={styles.registerLink}>Создайте сейчас!</Text>
          </TouchableOpacity>
        </RNView>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  logoBox: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f4c430',
    borderRadius: 20,
    padding: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    padding: 10,
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#f4c430',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#f4c430',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 