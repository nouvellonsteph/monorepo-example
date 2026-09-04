const endpoint = process.env.SORTING_API_URL ?? 'http://localhost:8787/route';
const parcels = [
  ['PKG00000001', '1011AB', 'express'],
  ['PKG00000002', '2511AA', 'standard'],
  ['PKG00000003', '3011AD', 'registered'],
  ['PKG00000004', '3511CE', 'express'],
  ['PKG00000005', '5611EM', 'standard'],
  ['PKG00000006', '6811DG', 'express'],
  ['PKG00000007', '8011PK', 'registered'],
  ['PKG00000008', '9711LV', 'standard'],
];

const results = await Promise.all(
  parcels.map(async ([barcode, destinationPostalCode, serviceLevel]) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ barcode, destinationPostalCode, serviceLevel }),
    });

    if (!response.ok) {
      throw new Error(`Routing failed for ${barcode}: HTTP ${response.status}`);
    }

    return response.json();
  }),
);

console.table(
  results.map(({ parcel, decision, performance }) => ({
    barcode: parcel.barcode,
    destination: parcel.destinationPostalCode,
    chute: decision.chute,
    region: decision.destinationRegion,
    decisionMs: performance.decisionMs,
    deadlineMs: performance.deadlineMs,
    onTime: performance.withinDeadline,
  })),
);
