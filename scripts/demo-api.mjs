#!/usr/bin/env node
/**
 * A fake Mentio API for trying the dashboard without a key: it reads the
 * real OpenAPI document (https://api.mentio.dev/v1/openapi.json) and answers
 * every operation with invented data shaped exactly like the real response.
 * Writes answer like the real API (201 with a resource, 204 on delete) but
 * change nothing. Used by `npm run demo`; never point production at it.
 *
 *   node scripts/demo-api.mjs [port]      default 4010
 *   DEMO_API_LOG=1 prints every write it receives
 */
import http from 'node:http';

const PORT = Number(process.argv[2] ?? process.env.DEMO_API_PORT ?? 4010);
const SPEC_URL = process.env.MENTIO_OPENAPI_URL ?? 'https://api.mentio.dev/v1/openapi.json';

const spec = await (await fetch(SPEC_URL)).json();
const schemas = spec.components?.schemas ?? {};

// ---- Deterministic sample values -------------------------------------------------

let seed = 7;
/** The query of the request being answered, for values that depend on it. */
let query = new URLSearchParams();
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pickOne = (list) => list[Math.floor(rand() * list.length)];

const TEXTS = [
  "We're evaluating acme vs the incumbent for our team, anyone switched recently? Mainly care about Slack alerts and price.",
  'the tool I use to answer every comment on my reels without a VA: acme, set up in ten minutes',
  'Does acme have an API for exporting mentions to CSV? The docs mention webhooks but I need a nightly dump.',
  'acme vs the incumbents: I tested brand monitoring 3 ways',
  'Webhook signature check fails with acme when the body has unicode. Repro attached.',
  'Switched our alerts to acme last month, the relevance scoring alone saved us an hour a day.',
];
const NAMES = ['ops_lead', 'Maya Chen', 'throwaway_dev', 'DevOps Weekly', 'octo-dev', 'Priya Builds', 'Jordan Lee', 'Sam Rivera'];
const TERMS = ['acme', 'rivalhq', 'social listening api', 'acme cloud'];
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const ID_PREFIX = { mention: 'mm', keyword: 'kw', person: 'per', alert: 'feed', channel: 'dst', group: 'grp', view: 'vw', segment: 'seg', key: 'key', member: 'mem', invitation: 'inv', activity: 'act', invoice: 'inv' };

function stringFor(name, schema, path) {
  // A breakdown row's key is the thing it counts, per the `by` it was asked for.
  if (name === 'key' || (name === 'label' && /analytics/.test(path))) {
    const keys = {
      intent: ['buy_intent', 'question', 'praise', 'comparison', 'bug_report', 'complaint', 'pricing'],
      sentiment: ['positive', 'neutral', 'negative'],
      status: ['open', 'done', 'ignored'],
      language: ['en', 'es', 'de', 'fr', 'pt'],
      keyword: TERMS,
      person: NAMES,
      hour: Array.from({ length: 24 }, (_, h) => String(h)),
    };
    return pickOne(keys[query.get('by')] ?? ['reddit', 'x', 'hackernews', 'github', 'youtube', 'linkedin']);
  }
  if (schema.format === 'date-time' || /At$/.test(name) || name === 'from' || name === 'to') return hoursAgo(Math.floor(rand() * 200));
  if (schema.format === 'uri' || /url$|^website$/i.test(name)) return name === 'avatarUrl' ? null : 'https://example.com';
  if (schema.format === 'email' || /email/i.test(name)) return pickOne(['maya@acme.dev', 'jordan@acme.dev', 'sam@acme.dev']);
  if (name === 'id') {
    // The nearest owner in the path: `.keyword.id` is a keyword's, `/v1/groups` a group's.
    const tokens = path.toLowerCase().split(/[./]/).reverse();
    const owner = tokens.map((t) => Object.keys(ID_PREFIX).find((k) => t === k || t === `${k}s` || t === k.replace(/y$/, 'ies'))).find(Boolean) ?? 'mention';
    return `${ID_PREFIX[owner]}_${Math.floor(rand() * 1e6).toString(36)}`;
  }
  if (/id$/i.test(name)) return `id_${Math.floor(rand() * 1e6).toString(36)}`;
  if (name === 'text' || name === 'body' || name === 'response') return pickOne(TEXTS);
  if (name === 'note') return 'A buyer comparing you with an incumbent; worth a reply today.';
  if (name === 'term') return pickOne(TERMS);
  // Named things read like what a team would call them, by the resource they belong to.
  const NAMED = [
    [/segments/, ['Unhappy power users', 'Buyers this month', 'Competitor fans', 'Developers on GitHub']],
    [/views/, ['Buying intent', 'Negative on X', 'Bug reports', 'Questions to answer']],
    [/alerts/, ['Negative mentions', 'Buying intent to Slack', 'Daily digest', 'Competitor switchers']],
    [/groups/, ['Acme', 'Globex', 'Initech']],
  ];
  const named = NAMED.find(([re]) => re.test(path.split('.')[0]))?.[1];
  if (name === 'name' && named && !/\.(author|person|member|owner|keyword|group)\./.test(path)) return pickOne(named);
  if (name === 'description' && named) return pickOne(['Worth a reply this week.', 'For the weekly review.', '']);
  if (/^(not)?[iI]ntents$/.test(name)) return pickOne(['buy_intent', 'question', 'complaint', 'bug_report', 'comparison', 'praise']);
  if (name === 'name' || name === 'author') return pickOne(NAMES);
  if (name === 'handle') return `@${pickOne(NAMES).toLowerCase().replace(/[^a-z]/g, '')}`;
  if (name === 'title') return pickOne(['Great tool', 'acme vs the incumbents', 'Weekly digest']);
  if (name === 'context') return 'acme is a brand monitoring API for developer tools.';
  if (name === 'currency') return 'USD';
  if (name === 'label') return pickOne(['#brand-alerts', 'Ops webhook', 'Team inbox']);
  if (name === 'secret') return 'whsec_demo_xxxxxxxxxxxxxxxx';
  if (name === 'key' && /api-keys/.test(path)) return 'mk_live_demo_xxxxxxxxxxxxxxxx';
  if (name === 'prefix') return 'mk_live_demo';
  if (name === 'language') return 'en';
  if (name === 'country') return 'us';
  if (name === 'timezone') return 'UTC';
  if (/day|date/i.test(name)) return new Date(Date.now() - Math.floor(rand() * 30) * 864e5).toISOString().slice(0, 10);
  return pickOne(['acme', 'demo', 'example']);
}

function numberFor(name, schema) {
  const lo = schema.minimum ?? 0;
  const hi = Math.min(schema.maximum ?? 5000, lo + 5000);
  if (/relevance|priority/i.test(name)) return 40 + Math.floor(rand() * 60);
  // share is a percentage (45.7); confidence and rates are fractions.
  if (name === 'share') return Math.round(rand() * 1000) / 10;
  if (/confidence|rate/i.test(name)) return Math.round(rand() * 100) / 100;
  if (/cents/i.test(name)) return Math.floor(rand() * 6000);
  if (/rating/i.test(name)) return 1 + Math.floor(rand() * 5);
  if (/followers|views|reach/i.test(name)) return Math.floor(rand() * 90000);
  const n = lo + rand() * (hi - lo);
  return schema.type === 'integer' ? Math.floor(n % 400) : Math.round(n * 100) / 100;
}

function sample(schema, name = '', path = '', depth = 0) {
  if (!schema || depth > 8) return null;
  if (schema.$ref) return sample(schemas[schema.$ref.split('/').pop()], name, path, depth + 1);
  for (const key of ['anyOf', 'oneOf']) {
    if (schema[key]) {
      const options = schema[key].filter((s) => s.type !== 'null');
      return options.length ? sample(pickOne(options), name, path, depth + 1) : null;
    }
  }
  if (schema.allOf) return Object.assign({}, ...schema.allOf.map((s) => sample(s, name, path, depth + 1)));
  if (schema.enum) return pickOne(schema.enum.filter((v) => v !== null));
  if ('const' in schema) return schema.const;
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type;
  switch (type) {
    case 'object': {
      const out = {};
      // A saved filter (a view's, a segment's, an alert rule's) sets a couple
      // of conditions, never all twenty: optional fields in one stay mostly unset.
      const sparse = /filter$/i.test(path);
      const required = new Set(schema.required ?? []);
      for (const [key, value] of Object.entries(schema.properties ?? {})) {
        if (sparse && !required.has(key) && rand() > 0.12) continue;
        out[key] = sample(value, key, `${path}.${key}`, depth + 1);
      }
      if (!schema.properties && schema.additionalProperties) out.demo = sample(schema.additionalProperties, 'demo', path, depth + 1);
      return out;
    }
    case 'array': {
      // A chart's points: one per day of a 30-day window, in order, with a gentle trend.
      if (name === 'points') {
        const start = Date.now() - 29 * 864e5;
        return Array.from({ length: 30 }, (_, i) => {
          const point = sample(schema.items, 'point', path, depth + 1) ?? {};
          const wave = 1 + 0.35 * Math.sin(i / 3) + i / 60;
          for (const key of Object.keys(point)) if (typeof point[key] === 'number') point[key] = Math.round((point[key] % 60) * wave) + 2;
          point.date = new Date(start + i * 864e5).toISOString().slice(0, 10);
          return point;
        });
      }
      const count = schema.maxItems ?? (depth <= 1 ? 8 : 2);
      return Array.from({ length: Math.min(count, depth <= 1 ? 8 : 2) }, () => sample(schema.items, name, path, depth + 1));
    }
    case 'string':
      return stringFor(name, schema, path);
    case 'integer':
    case 'number':
      return numberFor(name, schema);
    case 'boolean':
      // Flags that mean "something went wrong" stay mostly off, like real data.
      if (/^(failed|uncertain|automated|stopped|lowBalance|muted|paused.*)$/.test(name)) return rand() > 0.9;
      return rand() > 0.4;
    default:
      return null;
  }
}

// ---- Routing -------------------------------------------------------------------

const routes = [];
for (const [path, ops] of Object.entries(spec.paths)) {
  const pattern = new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}$`);
  for (const [method, op] of Object.entries(ops)) routes.push({ method: method.toUpperCase(), pattern, path, op });
}
// Literal paths win over templated ones: /mentions/export.csv before /mentions/{id}.
routes.sort((a, b) => (a.path.match(/\{/g) ?? []).length - (b.path.match(/\{/g) ?? []).length);

function respond(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type });
  res.end(body === undefined ? '' : type === 'application/json' ? JSON.stringify(body) : body);
}

const LOG = Boolean(process.env.DEMO_API_LOG);

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://demo');
    if (LOG && req.method !== 'GET') {
      let body = '';
      for await (const chunk of req) body += chunk;
      console.log(`${req.method} ${url.pathname}${url.search} ${body}`);
    }
    const route = routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));
    if (!route) return respond(res, 404, { error: { code: 'not_found', message: `No ${req.method} ${url.pathname}` } });
    seed = [...url.pathname].reduce((a, c) => a + c.charCodeAt(0), 7);
    query = url.searchParams;
    const responses = route.op.responses ?? {};
    const status = Object.keys(responses).find((code) => code.startsWith('2')) ?? '200';
    if (status === '204') return respond(res, 204);
    const content = responses[status]?.content ?? {};
    if (content['text/csv']) return respond(res, 200, 'id,platform,text\nmm_1,reddit,"acme vs the incumbent"\n', 'text/csv');
    const body = sample(content['application/json']?.schema, '', route.path);
    // Lists end after one page, so "older" links do not loop forever.
    if (body && typeof body === 'object' && 'nextCursor' in body) body.nextCursor = url.searchParams.get('cursor') ? null : 'demo_page_2';
    respond(res, Number(status), body);
  })
  .listen(PORT, () => console.log(`Demo Mentio API on http://localhost:${PORT} (${routes.length} operations)`));
