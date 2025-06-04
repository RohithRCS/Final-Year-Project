import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image, 
  Animated, 
  Dimensions, 
  ImageBackground,
  Platform,
  Linking
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

// Define types for navigation
type RootStackParamList = {
  Home: undefined;
  AboutUs: undefined;
  // Add other screens as needed
};

type AboutUsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AboutUs'>;

const { width } = Dimensions.get('window');

const AboutUsScreen: React.FC = () => {
  const navigation = useNavigation<AboutUsScreenNavigationProp>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Service items data with enhanced icons and updated gradients
  const services = [
    { 
      id: '1', 
      title: 'Emotion & Sentiment Analysis', 
      icon: 'brain',
      iconType: 'fontawesome5',
      description: 'Analyzes chat responses to understand emotional states.',
      gradient: ['#4285F4', '#83B0FF']
    },
    { 
      id: '2', 
      title: 'Medication & Meal Reminders', 
      icon: 'pills',
      iconType: 'fontawesome5',
      description: 'Timely reminders for medications, hydration and nutrition.',
      gradient: ['#4285F4', '#62A1FF']
    },
    { 
      id: '3', 
      title: 'Companion Chatbot', 
      icon: 'robot',
      iconType: 'fontawesome5',
      description: 'AI-powered conversation partner for daily interaction.',
      gradient: ['#3367D6', '#4285F4']
    },
    { 
      id: '4', 
      title: 'Music & Games', 
      icon: 'game-controller',
      iconType: 'ionicons',
      description: 'Entertainment options adapted for cognitive engagement.',
      gradient: ['#4285F4', '#A5C8FF']
    },
    { 
      id: '5', 
      title: 'Predictive Weather Updates', 
      icon: 'partly-sunny',
      iconType: 'ionicons',
      description: 'Weather forecasts with clothing and activity recommendations.',
      gradient: ['#73A6FF', '#4285F4']
    },
    { 
      id: '6', 
      title: 'Emergency Alerts', 
      icon: 'alert-circle',
      iconType: 'ionicons',
      description: 'One-touch emergency communication with designated contacts.',
      gradient: ['#1A56C7', '#4285F4']
    },
  ];

  const handleContact = (type: string) => {
    let action;
    if (type === 'phone') {
      action = 'tel:+919876543210';
    } else if (type === 'email') {
      action = 'mailto:support@elderassistapp.com';
    }
    
    if (action) {
      Linking.canOpenURL(action)
        .then(supported => {
          if (supported) {
            Linking.openURL(action);
          }
        })
        .catch(error => console.log('Error handling contact action:', error));
    }
  };

  const renderIcon = (service) => {
    if (service.iconType === 'fontawesome5') {
      return <FontAwesome5 name={service.icon} size={24} color="white" />;
    } else if (service.iconType === 'ionicons') {
      return <Ionicons name={service.icon} size={24} color="white" />;
    }
    return null;
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#4285F4', '#1A56C7']}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>👴🏻</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.headingContainer}>
            <Text style={styles.headingBold}>Elder Assist</Text>
            <Text style={styles.headingColored}> Where Age meets Assistance</Text>
          </View>
          
          <View style={styles.taglineContainer}>
            <LinearGradient
              colors={['rgba(66, 133, 244, 0.1)', 'rgba(66, 133, 244, 0.05)']}
              style={styles.taglineGradient}
            >
              <Text style={styles.description}>
                An AI-powered elderly assistance framework providing companionship, healthcare support, and safety features. 
                Includes reminders for medication, food, and water, along with emergency alerts for quick assistance.
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
        
        {/* Images with cards - Updated with primary color gradients */}
        <View style={styles.imagesContainer}>
          <View style={styles.imageCard}>
            <LinearGradient
              colors={['#4285F4', '#1A56C7']}
              style={[styles.imagePlaceholder, styles.imageShadow]}
            >
              <MaterialCommunityIcons name="hand-heart" size={48} color="white" />
              <Text style={styles.placeholderText}>Care Support</Text>
              <Text style={styles.placeholderSubtext}>24/7 assistance for seniors</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.imageCard}>
            <LinearGradient
              colors={['#4285F4', '#1A56C7']}
              style={[styles.imagePlaceholder, styles.imageShadow]}
            >
              <MaterialCommunityIcons name="account-heart" size={48} color="white" />
              <Text style={styles.placeholderText}>Elder Companionship</Text>
              <Text style={styles.placeholderSubtext}>AI-powered social interaction</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Overview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#4285F4" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionText}>
              Our app is dedicated to enhancing the quality of life for the elderly by offering companionship, 
              emotion recognition, personalized routines, and emergency alert systems. We use AI to create a caring 
              and engaging environment for seniors.
            </Text>
            <Text style={styles.sectionText}>
              Features include a companion chatbot, games, music playlists, and reminders for daily needs like 
              medications and meals. Our system also integrates sentiment analysis and predictive weather updates 
              to adapt care intelligently.
            </Text>
          </View>
        </View>
        
        {/* Services */}
        <View style={styles.servicesContainer}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="star-circle-outline" size={24} color="#4285F4" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Our Services</Text>
          </View>
          
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <LinearGradient
                  colors={service.gradient}
                  style={styles.serviceIconContainer}
                >
                  {renderIcon(service)}
                </LinearGradient>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Mission statement */}
        <View style={styles.missionContainer}>
          <LinearGradient
            colors={['rgba(26, 86, 199, 0.9)', 'rgba(66, 133, 244, 0.75)']}
            style={styles.missionGradient}
          >
            <Text style={styles.missionQuote}>"Our mission is to use technology to enhance the quality of life for seniors, ensuring they feel connected, cared for, and independent."</Text>
          </LinearGradient>
        </View>
        
        {/* Contact Footer */}
        <View style={styles.contactContainer}>
          <LinearGradient
            colors={['#1A56C7', '#0A2870']}
            style={styles.contactGradient}
          >
            <Text style={styles.contactTitle}>Contact Us</Text>
            <View style={styles.contactDivider} />
            
            <TouchableOpacity 
              style={styles.contactItem} 
              onPress={() => handleContact('phone')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={20} color="white" />
              </View>
              <Text style={styles.contactInfo}>+91 98765 43210</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={20} color="white" />
              </View>
              <Text style={styles.contactInfo}>support@elderassistapp.com</Text>
            </TouchableOpacity>
            
            <View style={styles.socialMediaContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-twitter" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  backButton: {
    elevation: 5,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButtonGradient: {
    padding: 8,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  headingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  headingBold: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  headingColored: {
    fontSize: 26,
    color: '#4285F4',
  },
  taglineContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  taglineGradient: {
    padding: 15,
    borderRadius: 15,
  },
  description: {
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  imagesContainer: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  imageCard: {
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  imageShadow: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  placeholderText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 5,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#4285F4',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionText: {
    color: '#444',
    marginBottom: 15,
    lineHeight: 22,
    fontSize: 15,
  },
  servicesContainer: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 48) / 2, // Two columns with margins
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  missionContainer: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  missionGradient: {
    padding: 20,
    borderRadius: 15,
  },
  missionQuote: {
    color: 'white',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
contactContainer: {
  height: 240,
  borderRadius: 20,
  marginLeft: 0,
  paddingLeft: 0,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
},
contactGradient: {
  padding: 25,
  // Removed alignItems: 'center' to prevent centering everything
},
contactTitle: {
  color: 'white',
  fontSize: 22,
  fontWeight: '600',
  marginBottom: 15,
  textAlign: 'center', // Keep only the title centered
},
contactDivider: {
  width: 60,
  height: 3,
  backgroundColor: '#4285F4',
  marginBottom: 20,
  borderRadius: 2,
  alignSelf: 'center', // Center the divider
},
contactItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
  // No center alignment here, so items will align left
},
contactIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(66, 133, 244, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
contactInfo: {
  color: 'white',
  fontSize: 16,
  marginLeft: 0
},
socialMediaContainer: {
  flexDirection: 'row',
  marginTop: 20,
  // No center alignment, so social icons will align left
},
socialButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 8,
  marginLeft: 0,
},
});

export default AboutUsScreen;