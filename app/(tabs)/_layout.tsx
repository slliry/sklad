import React from 'react';
import { Link, Tabs } from 'expo-router';
import { useColorScheme, Pressable } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCartShopping, faChartLine, faShoppingCart, faBell, faUser, faBoxesStacked, faReceipt } from '@fortawesome/free-solid-svg-icons';
import Colors from '../../constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesomeIcon>['icon'];
  color: string;
}) {
  return <FontAwesomeIcon size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
          height: 100,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
        headerTintColor: Colors[colorScheme].text,
        headerLeft: () => (
          <Link href="/checks" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesomeIcon
                  icon={faReceipt}
                  size={22}
                  color={Colors[colorScheme].text}
                  style={{ marginLeft: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesomeIcon
                  icon={faUser}
                  size={22}
                  color={Colors[colorScheme].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }}>
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Закуп',
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={faShoppingCart} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="warehouse"
        options={{
          title: 'Склад',
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faBoxesStacked} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Корзина',
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faShoppingCart} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Продажи',
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faChartLine} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
