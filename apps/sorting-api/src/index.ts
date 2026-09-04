import { env } from 'cloudflare:workers';
import { parseParcelMetadata, type OperationsEvent, type RouteDecision } from '@monorepo-example/contracts';

export default {
  async fetch(request, _bindings, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ service: 'sorting-api', status: 'ok' });
    }

    if (request.method !== 'POST' || url.pathname !== '/route') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const parcel = parseParcelMetadata(await request.json().catch(() => null));
    if (!parcel) {
      return Response.json({ error: 'Invalid parcel metadata' }, { status: 400 });
    }

    const requestId = request.headers.get('cf-ray') ?? crypto.randomUUID();
    const startedAt = performance.now();
    const routingResponse = await env.ROUTING_ENGINE.fetch('https://routing.internal/decide', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parcel),
    });

    if (!routingResponse.ok) {
      console.error({
        service: 'sorting-api',
        event: 'route.failed',
        requestId,
        downstreamStatus: routingResponse.status,
      });
      return Response.json({ error: 'Routing engine unavailable', requestId }, { status: 502 });
    }

    const decision = (await routingResponse.json()) as RouteDecision;
    const decisionMs = Number((performance.now() - startedAt).toFixed(2));
    const deadlineMs = Number(env.DECISION_DEADLINE_MS);
    const operationsEvent: OperationsEvent = {
      requestId,
      barcode: parcel.barcode,
      chute: decision.chute,
      decisionMs,
      deadlineMs,
      withinDeadline: decisionMs < deadlineMs,
      timestamp: new Date().toISOString(),
    };

    ctx.waitUntil(
      env.OPERATIONS_EVENTS.fetch('https://operations.internal/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(operationsEvent),
      })
        .then((response) => {
          if (!response.ok) {
            console.error({
              service: 'sorting-api',
              event: 'operations-event.rejected',
              requestId,
              downstreamStatus: response.status,
            });
          }
        })
        .catch((error: unknown) => {
          console.error({
            service: 'sorting-api',
            event: 'operations-event.failed',
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }),
    );

    console.log({
      service: 'sorting-api',
      event: 'route.completed',
      requestId,
      decisionMs,
      withinDeadline: operationsEvent.withinDeadline,
    });

    return Response.json({
      requestId,
      parcel,
      decision,
      performance: {
        decisionMs,
        deadlineMs,
        withinDeadline: operationsEvent.withinDeadline,
      },
    });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
