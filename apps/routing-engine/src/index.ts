import { env } from 'cloudflare:workers';
import { parseParcelMetadata } from '@monorepo-example/contracts';
import { selectRoute } from './routing.ts';

//hello

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ service: 'routing-engine', status: 'ok' });
    }

    if (request.method !== 'POST' || url.pathname !== '/decide') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const parcel = parseParcelMetadata(await request.json().catch(() => null));
    if (!parcel) {
      return Response.json({ error: 'Invalid parcel metadata' }, { status: 400 });
    }

    const decision = selectRoute(parcel);
    console.log({
      service: 'routing-engine',
      event: 'route.selected',
      barcode: parcel.barcode,
      chute: decision.chute,
      environment: env.ENVIRONMENT,
    });

    return Response.json(decision);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
