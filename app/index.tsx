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
        router.push('/editor');
        break;
      case 'color':
        router.push('/color');
        break;
      case 'home':
      case 'selfie':
      case 'calendar':
      case 'upgrade':
      case 'settings':
      case 'suggestions':
        // For now, just log - implement these pages later
        console.log(`Navigate to ${screen} - coming soon`);
        break;
      default:
        console.log('Unknown route:', screen);
    }
  };

  return <HomeScreen onNavigate={handleNavigate} currentTab="home" />;
}
