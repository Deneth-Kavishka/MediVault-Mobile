// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '../hooks/use-color-scheme';
import { ThemeProvider } from '../hooks/use-theme'; // ✅ your custom theme provider
import { sessionService } from '../src/services/sessionService';
import { storageService } from '../src/services/storageService';
import { queryClient } from '../src/store/queryClient';

export const unstable_settings = {
  initialRouteName: '(auth)/landing-page',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session on app launch
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { isValid, user } = await sessionService.restoreSession();
        
        if (isValid && user) {
          setIsAuthenticated(true);
          await sessionService.startAutoRefresh();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      sessionService.stopAutoRefresh();
    };
  }, []);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onLandingPage = segments[1] === 'landing-page';
    const onLoginPage = segments[1] === 'login';
    const onRegisterPage = segments[1] === 'register';
    const onForgotPasswordPage = segments[1] === 'forgot-password';
    const inTabsGroup = segments[0] === '(tabs)';

    // Don't auto-redirect if user is actively on auth pages (allow manual navigation)
    if (onLandingPage || onRegisterPage || onForgotPasswordPage) return;

    // Don't interfere when user is in tabs (already logged in and navigating)
    if (inTabsGroup) return;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to landing page if not authenticated and trying to access protected routes
      router.replace('/(auth)/landing-page' as any);
    } else if (isAuthenticated && inAuthGroup && !onLoginPage) {
      // Only redirect if authenticated and NOT on login page (to allow alert to show)
      const checkAndRedirect = async () => {
        const user = await storageService.getUser();
        if (user?.role === 'doctor') {
          router.replace('/(tabs)/doctor-dashboard' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      };
      checkAndRedirect();
    }
  }, [isAuthenticated, segments, isLoading]);

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#35c6ebff" />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Expo Router navigation */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>

      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ✅ Your custom theme provider MUST be the outermost wrapper */}
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
