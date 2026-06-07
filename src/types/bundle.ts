export type TripType = 'flightStay' | 'villa' | 'experience';

export type HighlightIcon =
  | 'airplane'
  | 'restaurant'
  | 'bed'
  | 'walk'
  | 'camera'
  | 'boat'
  | 'partly-sunny'
  | 'leaf'
  | 'water'
  | 'wine'
  | 'cafe'
  | 'bicycle'
  | 'compass'
  | 'fish'
  | 'flame'
  | 'star'
  | 'home'
  | 'musical-notes'
  | 'gift'
  | 'sparkles';

export type DayHighlight = {
  title: string;
  iconName: HighlightIcon;
};

export type Bundle = {
  id: string;
  destination: string;
  tripType: TripType;
  price: { amount: number; currency: 'INR' };
  duration: { days: number; nights: number };
  rating: number;
  heroImageUrl: string;
  highlights: DayHighlight[];
};
