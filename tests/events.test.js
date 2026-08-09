import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../lib/events.js';
test('both invitation events are configured',()=>{assert.equal(Object.keys(EVENTS).length,2);assert.match(EVENTS.preWedding.date,/10 October 2026/);assert.match(EVENTS.reception.date,/11 October 2026/)});
