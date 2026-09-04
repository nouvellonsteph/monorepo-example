# Sorting control UI

The React dashboard is served by a Cloudflare Worker with static assets. Requests to `/api/route` are forwarded to the sorting API through the `SORTING_API` service binding.

From the repository root:

```sh
npm run dev:sorting-ui
npm run deploy:sorting-ui
```
