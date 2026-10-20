import assert from 'node:assert/strict';
import { groupCandidates, plainSentence, sentimentScore, trafficLight } from './insights.ts';

const summary = (matched, positive, neutral, negative) => ({
  matched,
  sentiment: { positive, neutral, negative },
});

assert.equal(sentimentScore({ positive: 5, neutral: 2, negative: 3 }), 0.2);

const green = trafficLight(summary(30, 20, 8, 2), summary(25, 10, 8, 7));
assert.deepEqual(green, { color: 'green', label: 'Buena señal', isCrisis: false });

const yellow = trafficLight(summary(20, 5, 10, 5), summary(18, 6, 8, 4));
assert.deepEqual(yellow, { color: 'yellow', label: 'Atención', isCrisis: false });

const red = trafficLight(summary(20, 2, 2, 6), summary(20, 4, 4, 5));
assert.deepEqual(red, { color: 'red', label: 'Tono negativo', isCrisis: false });

const crisis = trafficLight(summary(60, 20, 20, 20), summary(30, 10, 10, 10));
assert.deepEqual(crisis, { color: 'red', label: 'Posible crisis', isCrisis: true });

const noData = trafficLight(summary(0, 0, 0, 0));
assert.deepEqual(noData, { color: 'gray', label: 'Sin datos aún', isCrisis: false });

assert.match(plainSentence(summary(42, 20, 12, 10), summary(30, 12, 10, 8), 'seguridad'), /40% más de ti/);
assert.match(plainSentence(summary(42, 20, 12, 10), summary(30, 12, 10, 8), 'seguridad'), /tema principal es «seguridad»/);

const candidate = (id, term, kind, groupId, context = null) => ({
  id,
  term,
  kind,
  group: { id: groupId, name: groupId, externalId: null, isDefault: false },
  context,
});

assert.deepEqual(groupCandidates([
  candidate('main', 'Ana Torres', 'brand', 'campaign-1'),
  candidate('alias', 'Anita Torres', 'brand', 'campaign-1', 'Variante de: Ana Torres'),
]), [
  { name: 'Ana Torres', kind: 'brand', keywordIds: ['main', 'alias'], mainId: 'main' },
]);

assert.deepEqual(groupCandidates([
  candidate('orphan', 'Anita', 'brand', 'campaign-1', 'Variante de: Ana Torres'),
]), [
  { name: 'Anita', kind: 'brand', keywordIds: ['orphan'], mainId: 'orphan' },
]);

assert.deepEqual(groupCandidates([
  candidate('brand-main', 'Ágora', 'brand', 'campaign-1'),
  candidate('competitor-main', 'Ágora', 'competitor', 'campaign-1'),
  candidate('competitor-alias', 'Agorita', 'competitor', 'campaign-1', 'Variante de: Ágora'),
]), [
  { name: 'Ágora', kind: 'brand', keywordIds: ['brand-main'], mainId: 'brand-main' },
  { name: 'Ágora', kind: 'competitor', keywordIds: ['competitor-main', 'competitor-alias'], mainId: 'competitor-main' },
]);

console.log('insights: self-check passed');
