# Workers monorepo example

A small parcel-routing system that demonstrates how independent Cloudflare Workers can live in one repository without sharing a deployment lifecycle.

## Architecture

```text
Depot metadata
      |
      v
sorting-ui  ---- service binding ---->  sorting-api  ---- service binding ---->  routing-engine
                                           |
                                           +------ async service binding ---> operations-events
```

- `sorting-ui` is the interactive control surface. Its Worker proxies browser requests to the API through a service binding.
- `sorting-api` is the machine-facing API. It owns request validation and the two-second decision deadline.
- `routing-engine` is private and independently deployable. It maps parcel metadata to a sorting chute.
- `operations-events` is private and independently observable. It receives structured completion events outside the response path.
- `packages/contracts` contains the small contract shared by all four Workers.

There is no Terraform layer in this demo. npm workspaces organize the repository, each Worker owns a `wrangler.jsonc`, and Workers Builds controls which project is rebuilt for each commit.

## Run locally

```bash
npm install
npm run check
npm run dev
```

The single development command starts the React UI and all four Workers through the Cloudflare Vite plugin. Open `http://localhost:5173`, or run the burst script in another terminal:

```bash
npm run demo
```

Or route one parcel directly:

```bash
curl http://localhost:5173/api/route \
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
npm run deploy:sorting-ui
```

Deploy the two private service-binding targets before the API and UI on the first deployment. Subsequent releases are independent.

See [`docs/workers-builds.md`](docs/workers-builds.md) for the four Workers Builds project configurations and watch paths.

## Demo walkthrough

1. Open the four `wrangler.jsonc` files and show separate names, bindings, and observability settings.
2. Run `npm run dev` and open the interactive control surface at `http://localhost:5173`.
3. Route one parcel, then run a peak burst to compare every decision with the two-second physical belt deadline.
4. Change `apps/routing-engine/src/routing.ts`; explain that only the routing-engine watch path triggers in Workers Builds.
5. Show the structured logs from each service. In production, each Worker has its own logs, traces, versions, and rollback history.
6. Change `packages/contracts/src/index.ts`; explain that the shared-package watch path intentionally triggers all consumers.

## Useful operations

```bash
npm run dry-run
npx wrangler tail monorepo-example-sorting-api
npx wrangler tail monorepo-example-sorting-ui
npx wrangler tail monorepo-example-routing-engine
npx wrangler tail monorepo-example-operations-events
npx wrangler versions list --name monorepo-example-routing-engine
```
