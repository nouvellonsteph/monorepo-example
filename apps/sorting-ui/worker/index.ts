import { env } from 'cloudflare:workers';

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/route' && request.method === 'POST') {
      return env.SORTING_API.fetch(new Request('https://sorting.internal/route', request));
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return env.SORTING_API.fetch('https://sorting.internal/health');
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
