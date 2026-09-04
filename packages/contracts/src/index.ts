export const serviceLevels = ['standard', 'express', 'registered'] as const;

export type ServiceLevel = (typeof serviceLevels)[number];

export interface ParcelMetadata {
  barcode: string;
  destinationPostalCode: string;
  serviceLevel: ServiceLevel;
}

export interface RouteDecision {
  chute: string;
  destinationRegion: string;
  priority: number;
}

export interface OperationsEvent {
  requestId: string;
  barcode: string;
  chute: string;
  decisionMs: number;
  deadlineMs: number;
  withinDeadline: boolean;
  timestamp: string;
}

export interface RoutingApiResponse {
  requestId: string;
  parcel: ParcelMetadata;
  decision: RouteDecision;
  performance: {
    decisionMs: number;
    deadlineMs: number;
    withinDeadline: boolean;
  };
}

export function parseParcelMetadata(value: unknown): ParcelMetadata | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const parcel = value as Record<string, unknown>;
  if (
    typeof parcel.barcode !== 'string' ||
    parcel.barcode.length < 8 ||
    typeof parcel.destinationPostalCode !== 'string' ||
    !/^\d{4}[A-Z]{2}$/.test(parcel.destinationPostalCode) ||
    !serviceLevels.includes(parcel.serviceLevel as ServiceLevel)
  ) {
    return null;
  }

  return {
    barcode: parcel.barcode,
    destinationPostalCode: parcel.destinationPostalCode,
    serviceLevel: parcel.serviceLevel as ServiceLevel,
  };
}
