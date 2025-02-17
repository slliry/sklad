import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <RNView style={styles.logoBox}>
          <Image 
            source={require('../../assets/images/favicon.png')} 
            style={styles.logo}
          />
        </RNView>
        <Text style={styles.title}>ДОБРО ПОЖАЛОВАТЬ В{'\n'}WARECUBE!</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push('./login')}
        >
          <Text style={styles.buttonText}>Войти</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={() => router.push('./register')}
        >
          <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#f4c430',
  },
  registerButton: {
    backgroundColor: '#f4c430',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#f4c430',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 