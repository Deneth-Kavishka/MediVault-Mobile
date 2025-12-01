// hooks/use-theme.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, StatusBar, View, Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

// Create context (undefined means provider not mounted)
const ThemeContext = createContext<ThemeMode | undefined>(undefined);

// Hook used by ThemedView / ThemedText
export function useTheme(): ThemeMode {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = Appearance.getColorScheme(); // "light" | "dark" | null
  const [theme, setTheme] = useState<ThemeMode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!theme && systemTheme) {
      setTheme(systemTheme);
    }
    if (!hydrated && theme) {
      setHydrated(true);
    }
  }, [systemTheme, theme]);

  // Minimizes flicker on first load
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar
          barStyle={Platform.OS === 'android' ? 'dark-content' : 'default'}
        />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={theme!}>
      {children}
    </ThemeContext.Provider>
  );
}
