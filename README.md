# Workers monorepo example

A small parcel-routing system that demonstrates how independent Cloudflare Workers can live in one repository without sharing a deployment lifecycle.

## Architecture

```text
Depot metadata
      |
      v
sorting-api  ---- service binding ---->  routing-engine
      |
      +------ async service binding ---> operations-events
```

- `sorting-api` is the only public Worker. It owns request validation and the two-second decision deadline.
- `routing-engine` is private and independently deployable. It maps parcel metadata to a sorting chute.
- `operations-events` is private and independently observable. It receives structured completion events outside the response path.
- `packages/contracts` contains the small contract shared by all three Workers.

There is no Terraform layer in this demo. npm workspaces organize the repository, each Worker owns a `wrangler.jsonc`, and Workers Builds controls which project is rebuilt for each commit.

## Run locally

```bash
npm install
npm run check
npm run dev
```

The single development command starts all three Workers in the local `workerd` runtime. In another terminal, run:

```bash
npm run demo
```

Or route one parcel directly:

```bash
curl http://localhost:8787/route \
  --request POST \
  --header 'content-type: application/json' \
  --data '{"barcode":"PKG00000001","destinationPostalCode":"1011AB","serviceLevel":"express"}'
```

## Independent deployments

Each command deploys only one Worker:

```bash
npm run deploy:routing-engine
npm run deploy:operations-events
npm run deploy:sorting-api
```

Deploy the two private service-binding targets before the public API on the first deployment. Subsequent releases are independent.

See [`docs/workers-builds.md`](docs/workers-builds.md) for the three Workers Builds project configurations and watch paths.

## Demo walkthrough

1. Open the three `wrangler.jsonc` files and show separate names, bindings, and observability settings.
2. Run `npm run dev` to start the complete system locally with one command.
3. Run `npm run demo` to route a burst of parcels and compare each decision with the two-second physical belt deadline.
4. Change `apps/routing-engine/src/routing.ts`; explain that only the routing-engine watch path triggers in Workers Builds.
5. Show the structured logs from each service. In production, each Worker has its own logs, traces, versions, and rollback history.
6. Change `packages/contracts/src/index.ts`; explain that the shared-package watch path intentionally triggers all consumers.

## Useful operations

```bash
npm run dry-run
npx wrangler tail monorepo-example-sorting-api
npx wrangler tail monorepo-example-routing-engine
npx wrangler tail monorepo-example-operations-events
npx wrangler versions list --name monorepo-example-routing-engine
```
