import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'playlists', title: 'Lists', icon: 'list-outline', iconFocused: 'list' },
  { name: 'search', title: 'Search', icon: 'search-outline', iconFocused: 'search' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f0f',
          borderTopColor: '#1c1c1e',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
      }}
    >
      {TAB_CONFIG.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? iconFocused : icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
