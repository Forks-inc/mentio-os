# Security

## Reporting a vulnerability

Report it privately through GitHub: **Security → Report a vulnerability** on this repository, with the details and, if you can, the steps to reproduce. Please do not open a public issue for a security problem.

## How this app handles secrets

- `MENTIO_API_KEY` is read on the server only (`src/lib/mentio.ts`). Pages render on the server, writes are server actions and exports are route handlers, so the key never reaches the browser.
- Set `DASHBOARD_PASSWORD` on any deployment that is not your own machine. Without it, whoever can open the app acts with the key's workspace.
- A read-only key (`scope: read`) gives a dashboard that cannot change anything: every write is refused by the API.
