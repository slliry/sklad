import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Image, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert(
        'Успех',
        'Регистрация прошла успешно! Теперь вы можете войти в свой аккаунт, если у вас есть доступ.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Этот email уже используется');
          break;
        case 'auth/invalid-email':
          setError('Неверный формат email');
          break;
        case 'auth/operation-not-allowed':
          setError('Регистрация временно недоступна');
          break;
        case 'auth/weak-password':
          setError('Пароль слишком простой');
          break;
        default:
          setError('Ошибка при регистрации. Попробуйте позже');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('./login');
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

        <RNView style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError('');
            }}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.inputIcon}
            disabled={loading}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
              size={24} 
              color="#999" 
            />
          </TouchableOpacity>
        </RNView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Text>
        </TouchableOpacity>

        <RNView style={styles.loginContainer}>
          <Text style={styles.loginText}>Уже есть аккаунт? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginLink}>Войти!</Text>
          </TouchableOpacity>
        </RNView>
      </View>
    </View>
  );
};

export default RegisterScreen;

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
  registerButton: {
    backgroundColor: '#f4c430',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#f4c430',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 