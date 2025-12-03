import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Icon from '../components/common/Icon';
import { COLORS } from '../config';

const { width, height } = Dimensions.get('window');

type WelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavigationProp>();

  return (
    <ImageBackground
      source={require('../images/welcomepage.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.overlay} />
      
      <View style={styles.container}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="home" size={50} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Real Estate</Text>
          <Text style={styles.subtitle}>Find Your Dream Home</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Explore Button - Premium gradient */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Explore')}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F5F5F5', '#EFEFEF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exploreButton}
            >
              <View style={styles.buttonIconContainer}>
                <LinearGradient
                  colors={['#A0522D', '#8B4513', '#6B3510']}
                  style={styles.iconGradient}
                >
                  <Icon name="compass-outline" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.exploreButtonText}>Explore Properties</Text>
                <Text style={styles.buttonSubtext}>Browse without signing in</Text>
              </View>
              <Icon name="chevron-forward" size={22} color={COLORS.primary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Join Us Button - Gradient brown */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#A0522D', '#8B4513', '#6B3510']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.joinButton}
            >
              <View style={styles.joinIconContainer}>
                <Icon name="person-add" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.joinButtonText}>Join Us</Text>
                <Text style={styles.joinButtonSubtext}>Create your free account</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Icon name="arrow-forward" size={18} color={COLORS.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Button - Glass effect */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <View style={styles.loginButton}>
              <View style={styles.loginIconContainer}>
                <Icon name="log-in" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.loginButtonText}>Already have an account? Login</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Discover thousands of properties for sale and rent
        </Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 69, 19, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    gap: 16,
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 14,
  },
  buttonIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  exploreButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C2C2C',
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  joinIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  joinButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
