// src/services/paymentService.ts
//
// This is the mobile-native replacement for your website's
// razorpayService.ts. It opens payment links in an in-app browser.

import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { getRazorpayPaymentLink } from '../constants/subscriptionPlans';
import type { SubscriptionTier } from '../types';

/**
 * Opens the Razorpay Payment Link for the selected tier
 * in an in-app web browser.
 */
export const openPaymentLink = async (
  tier: 'style_plus' | 'style_x'
): Promise<void> => {
  const paymentLink = getRazorpayPaymentLink(tier);

  if (!paymentLink) {
    Alert.alert(
      'Error',
      'Payment link is not configured. Please contact support.'
    );
    return;
  }

  try {
    // Open the Razorpay link in an in-app browser
    await WebBrowser.openBrowserAsync(paymentLink);
    // Note: We don't know the payment status here.
    // Razorpay will notify your backend via webhooks.
    // The user will see the status when their app reloads.
  } catch (error) {
    console.error('Failed to open web browser:', error);
    Alert.alert('Error', 'Failed to open payment page. Please try again.');
  }
};