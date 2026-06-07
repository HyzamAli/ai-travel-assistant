import type { TripType } from '@/types/bundle';

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

export function formatDuration({
  days,
  nights,
}: {
  days: number;
  nights: number;
}): string {
  return `${days}D ${nights}N`;
}

export const TRIP_TYPE_LABEL: Record<TripType, string> = {
  flightStay: 'Flight + Stay',
  villa: 'Villa',
  experience: 'Experience',
};
