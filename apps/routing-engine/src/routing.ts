import type { ParcelMetadata, RouteDecision } from '@monorepo-example/contracts';

const regionByFirstDigit: Record<string, string> = {
  '1': 'Amsterdam',
  '2': 'The Hague',
  '3': 'Rotterdam-Utrecht',
  '4': 'Southwest',
  '5': 'Southeast',
  '6': 'East',
  '7': 'Northeast',
  '8': 'North',
  '9': 'Groningen-Drenthe',
};

export function selectRoute(parcel: ParcelMetadata): RouteDecision {
  const regionCode = parcel.destinationPostalCode[0];
  const destinationRegion = regionByFirstDigit[regionCode] ?? 'Manual review';
  const priority = parcel.serviceLevel === 'express' ? 1 : parcel.serviceLevel === 'registered' ? 2 : 3;

  return {
    chute: `${regionCode}-${priority}`,
    destinationRegion,
    priority,
  };
}
