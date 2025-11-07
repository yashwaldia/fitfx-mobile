// Authentication & User Profile Types
export type Gender = 'Male' | 'Female' | 'Unisex' | 'Kids';
export type Style = 'American' | 'Indian' | 'Fusion' | 'Other';
export type Occasion = 
  | 'Traditional'
  | 'Cultural'
  | 'Modern'
  | 'Casual'
  | 'Festive'
  | 'Wedding'
  | 'Formal'
  | 'Business'
  | 'Street Fusion';
export type AgeGroup = 
  | 'Teen (13-17)'
  | 'Young Adult (18-25)'
  | 'Adult (26-35)'
  | 'Middle-Aged (36-45)'
  | 'Senior (46+)';
export type BodyType = 
  | 'Rectangle'
  | 'Triangle'
  | 'Inverted Triangle'
  | 'Hourglass'
  | 'Oval';

export interface UserProfile {
  name: string;
  age?: AgeGroup;
  gender?: Gender;
  bodyType?: BodyType;
  fashionIcons?: string;
  preferredOccasions?: Occasion[];
  preferredStyles?: Style[];
  favoriteColors?: string[];
  preferredFabrics?: string[];
}

export interface Subscription {
  tier: 'free' | 'premium' | 'elite';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  endDate?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}
