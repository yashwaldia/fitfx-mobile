import React from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '../src/screens/HomeScreen';

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    
    switch (screen) {
      case 'wardrobe':
        router.push('/wardrobe');
        break;
      case 'editor':
        router.push({ pathname: '/wardrobe', params: { tab: 'ai' } });
        break;
      case 'color':
        router.push('/color');
        break;
      case 'upgrade':
        router.push('/upgrade');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'home':
        router.push('/');
        break;
      case 'selfie':
        // This is handled by the modal in HomeScreen
        console.log('Selfie modal will open');
        break;
      
      // ✅ --- THIS IS THE FIX --- ✅
      case 'calendar':
      case 'suggestions':
        router.push('/calendar'); // Replaced the "coming soon" log
        break;
      // ✅ -------------------------- ✅

      default:
        console.log('Unknown route:', screen);
    }
  };

  return <HomeScreen onNavigate={handleNavigate} currentTab="home" />;
}