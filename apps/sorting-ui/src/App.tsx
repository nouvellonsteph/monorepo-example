import { startTransition, useState, type FormEvent } from 'react';
import { Badge, Button, Input, Select } from '@cloudflare/kumo';
import { PackageIcon, PlayIcon } from '@phosphor-icons/react';
import type { ParcelMetadata, RoutingApiResponse, ServiceLevel } from '@monorepo-example/contracts';

const burstParcels: ParcelMetadata[] = [
  { barcode: 'PKG00000011', destinationPostalCode: '1011AB', serviceLevel: 'express' },
  { barcode: 'PKG00000012', destinationPostalCode: '2511AA', serviceLevel: 'standard' },
  { barcode: 'PKG00000013', destinationPostalCode: '3011AD', serviceLevel: 'registered' },
  { barcode: 'PKG00000014', destinationPostalCode: '3511CE', serviceLevel: 'express' },
  { barcode: 'PKG00000015', destinationPostalCode: '5611EM', serviceLevel: 'standard' },
  { barcode: 'PKG00000016', destinationPostalCode: '6811DG', serviceLevel: 'express' },
  { barcode: 'PKG00000017', destinationPostalCode: '8011PK', serviceLevel: 'registered' },
  { barcode: 'PKG00000018', destinationPostalCode: '9711LV', serviceLevel: 'standard' },
];

const serviceLevelItems: Record<ServiceLevel, string> = {
  standard: 'Standard',
  express: 'Express',
  registered: 'Registered',
};

async function requestRoute(parcel: ParcelMetadata): Promise<RoutingApiResponse> {
  const response = await fetch('/api/route', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parcel),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? `Routing failed with HTTP ${response.status}`);
  }

  return response.json() as Promise<RoutingApiResponse>;
}

function CornerBrackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export function App() {
  const [barcode, setBarcode] = useState('PKG00000001');
  const [postalCode, setPostalCode] = useState('1011AB');
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('express');
  const [history, setHistory] = useState<RoutingApiResponse[]>([]);
  const [active, setActive] = useState<RoutingApiResponse | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const averageMs = history.length
    ? history.reduce((total, item) => total + item.performance.decisionMs, 0) / history.length
    : 0;
  const onTimeCount = history.filter((item) => item.performance.withinDeadline).length;

  function recordResult(result: RoutingApiResponse) {
    startTransition(() => {
      setActive(result);
      setHistory((current) => [result, ...current].slice(0, 20));
    });
  }

  async function route(parcel: ParcelMetadata) {
    setPending((count) => count + 1);
    setError(null);
    try {
      recordResult(await requestRoute(parcel));
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Unable to route parcel');
    } finally {
      setPending((count) => count - 1);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void route({
      barcode: barcode.trim(),
      destinationPostalCode: postalCode.trim().toUpperCase(),
      serviceLevel,
    });
  }

  async function runBurst() {
    setPending((count) => count + burstParcels.length);
    setError(null);
    const results = await Promise.allSettled(burstParcels.map(requestRoute));
    const failures = results.filter((result) => result.status === 'rejected');
    for (const result of results) {
      if (result.status === 'fulfilled') {
        recordResult(result.value);
      }
    }
    if (failures.length) {
      setError(`${failures.length} parcel requests failed`);
    }
    setPending((count) => count - burstParcels.length);
  }

  return (
    <main className="page-shell">
      <div className="dot-grid" aria-hidden="true" />
      <div className="guide guide-left" aria-hidden="true" />
      <div className="guide guide-right" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Parcel flow control home">
          <span className="brand-mark">W</span>
          <span>Parcel flow control</span>
        </a>
        <div className="topbar-status">
          <Badge variant={error ? 'error' : active ? 'success' : 'neutral'} appearance="dot">
            {error ? 'API unavailable' : active ? 'Edge API connected' : 'Ready for request'}
          </Badge>
          <span className="environment">production topology</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">REAL-TIME SORTING CONTROL</p>
          <h1>Make the routing decision before the belt comes around.</h1>
          <p className="hero-copy">
            Send parcel metadata through independently deployed Workers and compare every decision against a
            two-second physical sorting deadline.
          </p>
        </div>
        <div className="deadline-orbit" aria-label="Two second routing deadline">
          <span className="orbit-label">DECISION WINDOW</span>
          <strong>2.00</strong>
          <span>seconds</span>
        </div>
      </section>

      <section className="workspace">
        <section className="panel control-panel">
          <CornerBrackets />
          <div className="panel-heading">
            <div>
              <p className="section-number">01 / INTAKE</p>
              <h2>Route a parcel</h2>
            </div>
            <Badge variant="orange">API request</Badge>
          </div>

          <form onSubmit={handleSubmit} className="route-form">
            <Input
              label="Barcode"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="PKG00000001"
              required
            />
            <Input
              label="Destination postal code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value.toUpperCase())}
              placeholder="1011AB"
              required
              maxLength={6}
            />
            <Select
              label="Service level"
              value={serviceLevel}
              onValueChange={(value) => setServiceLevel(value ?? 'standard')}
              items={serviceLevelItems}
            />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <Button type="submit" variant="primary" size="lg" loading={pending === 1} icon={<PackageIcon />}>
                Route parcel
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => void runBurst()} disabled={pending > 0} icon={<PlayIcon />}>
                Run peak burst
              </Button>
            </div>
          </form>
        </section>

        <section className="panel flow-panel">
          <CornerBrackets />
          <div className="panel-heading">
            <div>
              <p className="section-number">02 / LIVE PATH</p>
              <h2>Edge decision flow</h2>
            </div>
            <span className="request-id">{active?.requestId.slice(0, 12) ?? 'awaiting request'}</span>
          </div>

          <div className="belt" aria-live="polite">
            <div className="belt-line" aria-hidden="true" />
            {active ? <div key={active.requestId} className="parcel-marker"><PackageIcon /></div> : null}
            <div className="flow-node">
              <span>01</span>
              <strong>Depot scan</strong>
              <small>metadata only</small>
            </div>
            <div className="flow-node">
              <span>02</span>
              <strong>Sorting API</strong>
              <small>public Worker</small>
            </div>
            <div className="flow-node">
              <span>03</span>
              <strong>Route engine</strong>
              <small>service binding</small>
            </div>
            <div className="flow-node flow-node-accent">
              <span>04</span>
              <strong>Chute {active?.decision.chute ?? '--'}</strong>
              <small>{active?.decision.destinationRegion ?? 'waiting'}</small>
            </div>
          </div>

          <div className="deadline-meter">
            <div className="meter-labels">
              <span>Last decision</span>
              <strong>{active ? `${active.performance.decisionMs.toFixed(2)} ms` : '-- ms'}</strong>
            </div>
            <div className="meter-track">
              <div
                className="meter-value"
                style={{ width: active ? `${Math.max(1, Math.min(100, active.performance.decisionMs / 20))}%` : '0%' }}
              />
              <span className="meter-deadline">2,000 ms</span>
            </div>
          </div>
        </section>
      </section>

      <section className="metrics" aria-label="Routing performance">
        <div className="metric">
          <span>Decisions</span>
          <strong>{history.length.toString().padStart(2, '0')}</strong>
        </div>
        <div className="metric">
          <span>Average latency</span>
          <strong>{history.length ? `${averageMs.toFixed(1)} ms` : '--'}</strong>
        </div>
        <div className="metric">
          <span>Within deadline</span>
          <strong>{history.length ? `${onTimeCount}/${history.length}` : '--'}</strong>
        </div>
        <div className="metric">
          <span>Requests in flight</span>
          <strong>{pending.toString().padStart(2, '0')}</strong>
        </div>
      </section>

      <section className="panel history-panel">
        <CornerBrackets />
        <div className="panel-heading">
          <div>
            <p className="section-number">03 / OPERATIONS</p>
            <h2>Recent decisions</h2>
          </div>
          <Badge variant="beta">per-service telemetry</Badge>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Destination</th>
                <th>Service</th>
                <th>Chute</th>
                <th>Latency</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {history.length ? history.map((item) => (
                <tr key={item.requestId}>
                  <td className="mono">{item.parcel.barcode}</td>
                  <td>{item.parcel.destinationPostalCode}</td>
                  <td>{serviceLevelItems[item.parcel.serviceLevel]}</td>
                  <td><Badge variant="orange">{item.decision.chute}</Badge></td>
                  <td className="mono">{item.performance.decisionMs.toFixed(2)} ms</td>
                  <td><Badge variant={item.performance.withinDeadline ? 'success' : 'error'} appearance="dot">{item.performance.withinDeadline ? 'On time' : 'Missed'}</Badge></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="empty-state">Route a parcel or run a peak burst to populate live decisions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer>
        <span>Four Workers. One repository. Independent releases.</span>
        <span className="mono">workerd / service bindings / Workers Builds</span>
      </footer>
    </main>
  );
}
