import React from 'react';
import { useRouter } from 'expo-router';
// This path assumes your 'src' and 'app' folders are in the same root directory.
import CalendarScreen from '../src/screens/CalendarScreen';

export default function CalendarPage() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    if (screen === 'home') {
      router.replace('/');
    }
    // No 'else' block is needed because this function is only
    // used by the CalendarScreen's back button, which just goes 'home'.
  };

  // This renders your CalendarScreen component as a new page
  // and gives it the 'onNavigate' prop so its back button works.
  return <CalendarScreen onNavigate={handleNavigate} />;
}