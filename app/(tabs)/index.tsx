import React from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '../../src/screens/HomeScreen';

export default function HomeTab() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    
    switch (screen) {
      case 'home':
        router.push('/(tabs)');
        break;
      case 'wardrobe':
        router.push('/wardrobe');
        break;
      case 'editor':
        router.push('/editor');
        break;
      case 'color':
        router.push({
            pathname: '/color',
            params: {
              selfieImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // This is a 1x1 black pixel
              occasion: 'Casual',
              country: 'USA',
              gender: 'Female',
              age: '30',
              preferredColors: 'blue,green',
            },
          });
          break;
      case 'selfie':
      case 'calendar':
      case 'upgrade':
      case 'settings':
      case 'suggestions':
        console.log(`${screen} - coming soon`);
        break;
      default:
        console.log('Unknown route:', screen);
    }
  };

  return <HomeScreen onNavigate={handleNavigate} currentTab="home" />;
}
