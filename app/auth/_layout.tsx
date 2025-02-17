import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        headerTitle: '',
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          headerTitle: '',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
          headerTitle: '',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
} 