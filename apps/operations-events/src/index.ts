import { env } from 'cloudflare:workers';
import type { OperationsEvent } from '@monorepo-example/contracts';

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ service: 'operations-events', status: 'ok' });
    }

    if (request.method !== 'POST' || url.pathname !== '/events') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const event = (await request.json().catch(() => null)) as OperationsEvent | null;
    if (!event?.requestId || !event.barcode || !event.chute) {
      return Response.json({ error: 'Invalid operations event' }, { status: 400 });
    }

    console.log({
      service: 'operations-events',
      event: 'routing.completed',
      environment: env.ENVIRONMENT,
      ...event,
    });

    return new Response(null, { status: 202 });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
