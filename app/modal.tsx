import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { auth } from './config/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { router, Stack } from 'expo-router';

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || 'Пользователь');
      setEmail(auth.currentUser.email || '');
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      setIsEditing(false);
      Alert.alert('Успех', 'Профиль успешно обновлен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#666" />
            </TouchableOpacity>
          ),
          headerTitle: "Профиль"
        }}
      />

      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <FontAwesomeIcon 
            icon={faUserCircle} 
            size={100} 
            color="#666"
          />
        </View>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Введите имя"
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.username}>{displayName}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Изменить имя</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="key-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Изменить пароль</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Настройки профиля</Text>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#f4c430',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  settingsContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
