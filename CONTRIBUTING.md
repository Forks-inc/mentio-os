# Contributing

Issues and pull requests are welcome. Mentio OS is built only on the public [Mentio API](https://docs.mentio.dev) through [`@mentio-dev/sdk`](https://www.npmjs.com/package/@mentio-dev/sdk), so anything you can do with an API key you can add here.

## Working on it

```bash
npm install
npm run demo        # the app on invented data, no key needed
npm run typecheck
npm run build
```

CI runs the same three on every pull request, plus a smoke test of the main pages on demo data.

## Conventions

They are in [AGENTS.md](AGENTS.md), for people and coding agents alike: every control is a shadcn component, lists are tables with filter chips kept in the URL, opening or creating something is a drawer, and the API key never leaves the server.

A new version of the SDK arrives as a Dependabot pull request; when the API adds an endpoint, a page for it is a good first contribution.
