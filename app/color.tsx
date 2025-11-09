// This is the entire content for app/color.tsx
import React from 'react';
import ColorMatrixScreen from '../src/screens/ColorMatrixScreen';

// This file (app/color.tsx) is the route,
// and it now renders the real ColorMatrixScreen component
// instead of the "Coming Soon!" placeholder.


export default function ColorMatrix() {
  return <ColorMatrixScreen />;
}