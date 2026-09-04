import { describe, expect, it } from 'vitest';
import { selectRoute } from './routing.ts';

describe('selectRoute', () => {
  it('prioritizes express parcels for the Amsterdam region', () => {
    expect(
      selectRoute({
        barcode: 'PKG00000001',
        destinationPostalCode: '1011AB',
        serviceLevel: 'express',
      }),
    ).toEqual({
      chute: '1-1',
      destinationRegion: 'Amsterdam',
      priority: 1,
    });
  });
});
