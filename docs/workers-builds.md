# Workers Builds setup

Connect [`nouvellonsteph/monorepo-example`](https://github.com/nouvellonsteph/monorepo-example) to three Workers Builds projects. Keep the repository root as the root directory so npm can resolve the workspaces and shared contract.

| Worker project | Root directory | Build command | Deploy command |
| --- | --- | --- | --- |
| `monorepo-example-sorting-api` | `/` | `npm run check` | `npm run deploy:sorting-api` |
| `monorepo-example-routing-engine` | `/` | `npm run check` | `npm run deploy:routing-engine` |
| `monorepo-example-operations-events` | `/` | `npm run check` | `npm run deploy:operations-events` |

## Watch paths

Configure include paths under **Worker > Settings > Build > Build watch paths**.

### sorting-api

```text
apps/sorting-api/**
packages/contracts/**
package.json
package-lock.json
tsconfig.json
```

### routing-engine

```text
apps/routing-engine/**
packages/contracts/**
package.json
package-lock.json
tsconfig.json
```

### operations-events

```text
apps/operations-events/**
packages/contracts/**
package.json
package-lock.json
tsconfig.json
```

The result is an explicit dependency graph:

- A change under one application triggers only that Worker.
- A shared contract change triggers all three consumers.
- A root dependency or TypeScript configuration change triggers all three projects.
- Each triggered Worker creates its own build status and deployment history.

Workers Builds uses the Wrangler version pinned in `package-lock.json`; it is the deployment tool for each Worker, not the monorepo orchestrator.

## Observability

Each `wrangler.jsonc` enables invocation logs and traces at 100% sampling for the demo. The Workers dashboard therefore exposes separate telemetry for:

- depot-facing request handling in `monorepo-example-sorting-api`;
- routing decisions in `monorepo-example-routing-engine`;
- asynchronous operational events in `monorepo-example-operations-events`.

For production traffic, reduce the per-Worker `head_sampling_rate` according to volume and retention requirements.

References:

- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Build watch paths](https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/)
- [Monorepo setup](https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/#monorepos)
- [Multi-Worker local development](https://developers.cloudflare.com/workers/local-development/multi-workers/)
- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Workers Traces](https://developers.cloudflare.com/workers/observability/traces/)
