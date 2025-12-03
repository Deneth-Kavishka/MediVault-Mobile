import { authApi } from '@/api/auth';
import { storageService } from '@/services/storageService';
import { LoginCredentials } from '@/types/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn, useScaleIn, useSlideInLeft } from '../../utils/animations';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'pharmacist' | 'admin'>('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Slow animations (600-800ms)
  const backButtonAnim = useFadeIn(0, 400);
  const logoAnim = useScaleIn(200);
  const titleAnim = useSlideInLeft(300);
  const formAnim = useFadeIn(400, 600);
  const footerAnim = useFadeIn(800, 600);

  const validate = () => {
    const e: typeof errors = {};
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const testUsernames = ['admin123', 'doctor123', 'patient123', 'pharmacists123', 'labtec123'];

    if (!email) e.email = 'Email is required';
    else if (!testUsernames.includes(email.toLowerCase()) && !emailRegex.test(email)) {
      e.email = 'Enter a valid email';
    }

    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    // Testing mode: Check username for role-based navigation
    const username = email.toLowerCase();
    
    if (username === 'admin123' || username === 'doctor123' || username === 'patient123' || username === 'pharmacists123' || username === 'labtec123') {
      try {
        // Store mock authentication data for testing
        const mockToken = 'test-token-' + username;
        const mockUser = {
          id: username === 'admin123' ? 1 : username === 'doctor123' ? 2 : username === 'pharmacists123' ? 4 : username === 'labtec123' ? 5 : 3,
          email: username,
          fullName: username === 'admin123' ? 'Admin User' : username === 'doctor123' ? 'Doctor User' : username === 'pharmacists123' ? 'Pharmacist User' : username === 'labtec123' ? 'Lab Technician User' : 'Patient User',
          phone: '+1234567890',
          role: (username === 'admin123' ? 'admin' : username === 'doctor123' ? 'doctor' : username === 'pharmacists123' ? 'pharmacist' : username === 'labtec123' ? 'lab_technician' : 'patient') as 'patient' | 'doctor' | 'pharmacist' | 'lab_technician' | 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await storageService.setToken(mockToken);
        await storageService.setUser(mockUser);
        
        // Set session expiry based on remember me
        const expiryTime = rememberMe 
          ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          : Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        
        await storageService.setSessionExpiry(expiryTime);
        await storageService.setRememberMe(rememberMe);
        
        // Update authentication state (this will trigger navigation in _layout.tsx)
        // The _layout.tsx will handle the redirect based on user role
        setLoading(false);
        
        // Navigation will happen automatically after storage is updated
        return;
      } catch (error: any) {
        setLoading(false);
        Alert.alert('Login Failed', 'An error occurred during test login');
        return;
      }
    }

    // For other usernames, try actual API call
    try {
      const credentials: LoginCredentials = { email, password, role };
      const response = await authApi.login(credentials);
      const { token, user, sessionId } = response.data as any;
      
      // Store authentication data
      await storageService.setToken(token);
      await storageService.setUser(user);
      
      // Store session data
      if (sessionId) {
        await storageService.setSessionId(sessionId);
      }
      
      // Set session expiry based on remember me
      const expiryTime = rememberMe 
        ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        : Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      await storageService.setSessionExpiry(expiryTime);
      await storageService.setRememberMe(rememberMe);

      // Navigate based on role
      if (role === 'doctor') {
        router.replace('/(tabs)/doctor-dashboard' as any);
      } else {
        router.replace('/(tabs)');
      }

    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        
        {/* Back Button - Fixed Position */}
        <Animated.View style={backButtonAnim}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              console.log('Back button pressed');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        </Animated.View>



        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >

            {/* Login Card */}
            <View style={styles.cardContainer}>
              <Animated.View style={[styles.card, formAnim]}>
                {/* Welcome Icon */}
                <Animated.View style={[styles.welcomeIconContainer, logoAnim]}>
                  <View style={styles.welcomeIconBadge}>
                    <MaterialCommunityIcons name="heart-pulse" size={32} color="#fff" />
                  </View>
                </Animated.View>

                {/* Card Header */}
                <Animated.View style={[styles.cardHeader, titleAnim]}>
                  <RNText style={styles.cardTitle}>Welcome Back</RNText>
                  <RNText style={styles.cardSubtitle}>Sign in to access your healthcare dashboard</RNText>
                </Animated.View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                  {/* Username/Email Input */}
                  <View style={styles.inputWrapper}>
                    <RNText style={styles.inputLabel}>Username</RNText>
                    <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                      <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="demo-medico37@gmail.com"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.email && <RNText style={styles.errorText}>{errors.email}</RNText>}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <RNText style={styles.inputLabel}>Password</RNText>
                    <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                      <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons 
                          name={showPassword ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color="#6B7280" 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <RNText style={styles.errorText}>{errors.password}</RNText>}
                  </View>

                  {/* Remember Me & Forgot Password */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity 
                      style={styles.rememberMeContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <RNText style={styles.rememberMeText}>Remember me</RNText>
                    </TouchableOpacity>

                    <Link href="/(auth)/forgot-password" asChild>
                      <TouchableOpacity style={styles.forgotButton}>
                        <RNText style={styles.forgotText}>Forgot Password?</RNText>
                      </TouchableOpacity>
                    </Link>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    disabled={loading}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <RNText style={styles.loginButtonText}>
                        {loading ? 'Signing in...' : 'Sign In'}
                      </RNText>
                      {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
                    </View>
                  </TouchableOpacity>

                  {/* Register Link */}
                  <View style={styles.registerSection}>
                    <RNText style={styles.registerText}>Don't have an account?</RNText>
                    <Link href="/(auth)/register" asChild>
                      <TouchableOpacity>
                        <RNText style={styles.registerLink}> Create Account</RNText>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, footerAnim]}>
              <View style={styles.footerContent}>
                <Ionicons name="shield-checkmark" size={14} color="#6B7280" />
                <RNText style={styles.footerText}>Secured with end-to-end encryption</RNText>
                <Ionicons name="lock-closed" size={12} color="#F59E0B" />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.3)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: isSmallScreen ? 30 : 40,
    paddingHorizontal: isTablet ? 40 : 20,
    justifyContent: 'center',
  },
  
  // Back Button
  backButton: {
    position: 'absolute',
    top: isSmallScreen ? 20 : 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 10 },
    }),
  },

  // Card Styles
  cardContainer: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: isSmallScreen ? 20 : 24,
    padding: isSmallScreen ? 28 : isTablet ? 40 : 32,
    maxWidth: isTablet ? 500 : isSmallScreen ? '100%' : 400,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  welcomeIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#35c6ebff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor:  '#35c6ebff',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  cardHeader: {
    marginBottom: isSmallScreen ? 24 : 28,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: isSmallScreen ? 24 : 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },


  // Form Styles
  formSection: {
    gap: isSmallScreen ? 16 : 20,
  },
  inputWrapper: {
    marginBottom: isSmallScreen ? 4 : 8,
  },
  inputLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: isSmallScreen ? 48 : 54,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Options Row (Remember Me & Forgot Password)
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#F9FAFB',
  },
  checkboxChecked: {
    backgroundColor: '#35c6ebff',
    borderColor: '#35c6ebff',
  },
  rememberMeText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#4B5563',
    fontWeight: '500',
  },

  // Buttons
  forgotButton: {
    paddingVertical: 8,
  },
  forgotText: {
    color: '#3B82F6',
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor:  '#35c6ebff',
    borderRadius: 12,
    height: isSmallScreen ? 50 : 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor:  '#35c6ebff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },


  // Register Section
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});