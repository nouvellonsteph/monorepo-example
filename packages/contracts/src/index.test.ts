import { describe, expect, it } from 'vitest';
import { parseParcelMetadata } from './index.ts';

describe('parseParcelMetadata', () => {
  it('accepts depot metadata without image data', () => {
    expect(
      parseParcelMetadata({
        barcode: 'PKG00000001',
        destinationPostalCode: '1011AB',
        serviceLevel: 'express',
      }),
    ).toEqual({
      barcode: 'PKG00000001',
      destinationPostalCode: '1011AB',
      serviceLevel: 'express',
    });
  });

  it('rejects malformed postal codes', () => {
    expect(
      parseParcelMetadata({
        barcode: 'PKG00000001',
        destinationPostalCode: '1011',
        serviceLevel: 'standard',
      }),
    ).toBeNull();
  });
});
