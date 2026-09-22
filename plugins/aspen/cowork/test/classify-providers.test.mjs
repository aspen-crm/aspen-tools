// The classifier's provider adapters: the prompt each one renders, the schema it constrains
// the answer with, and the confidence it can honestly report. No network — every adapter is
// pure, taking a response body and returning normalised answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVIDERS, PROVIDER_NAMES, ProviderError, deriveConfidence, packText, schemaFor,
} from '../skills/classify-records/scripts/providers.mjs';

const QUESTIONS = {
  priority: { type: 'choice', instructions: 'How urgent?', criteria: { hot: 'call today', cold: 'nurture' } },
  fit: { type: 'score', instructions: 'Rate the fit.', criteria: ['none', 'weak', 'strong'] },
  is_spam: { type: 'noul', instructions: 'Junk?' },
};
const STATE = { name_p: 'Ada', notes_c: 'wants a demo' };

/** A token stream whose concatenation is `json`, every token at the same probability. */
const tokens = (parts, logprob = Math.log(0.95)) => parts.map((text) => ({ text, logprob }));

// --- the rendered pack ------------------------------------------------------------------

test('the pack renders every question, its labels and their definitions', () => {
  const text = packText(QUESTIONS);
  assert.match(text, /## priority \(choice\)/);
  assert.match(text, /- hot: call today/);
  assert.match(text, /- 3: strong/, 'score levels are numbered from 1');
  assert.match(text, /## is_spam \(noul\)/);
  assert.match(text, /Answer with exactly one of these option names/);
});

// --- the schema -------------------------------------------------------------------------

test('each question type becomes the constraint that fits it', () => {
  const s = schemaFor(QUESTIONS);
  assert.deepEqual(s.properties.priority, { type: 'string', enum: ['hot', 'cold'] });
  assert.deepEqual(s.properties.fit, { type: 'integer', minimum: 1, maximum: 3 });
  assert.deepEqual(s.properties.is_spam, { type: 'boolean' });
  assert.deepEqual(s.required, ['priority', 'fit', 'is_spam']);
  assert.equal(s.additionalProperties, false);
});

// Gemini's response schema is an OpenAPI subset that rejects the key outright, so the flag
// is not a style preference — a schema carrying it fails the request.
test('additionalProperties can be left off for a provider that refuses it', () => {
  assert.equal('additionalProperties' in schemaFor(QUESTIONS, { additionalProperties: false }), false);
});

// --- confidence from logprobs -------------------------------------------------------------

test('a value is located in the token stream and scored by its weakest token', () => {
  const stream = [
    { text: '{"', logprob: Math.log(0.99) },
    { text: 'priority', logprob: Math.log(0.99) },
    { text: '":"', logprob: Math.log(0.99) },
    { text: 'hot', logprob: Math.log(0.62) },
    { text: '"}', logprob: Math.log(0.99) },
  ];
  const c = deriveConfidence(stream, 'priority', 'hot');
  assert.ok(Math.abs(c - 0.62) < 1e-9, `expected the label's own token probability, got ${c}`);
});

test('a multi-token label is scored by its weakest token, not the product', () => {
  const stream = [
    { text: '{"k":"', logprob: Math.log(0.99) },
    { text: 'un', logprob: Math.log(0.8) },
    { text: 'clear', logprob: Math.log(0.7) },
    { text: '"}', logprob: Math.log(0.99) },
  ];
  const c = deriveConfidence(stream, 'k', 'unclear');
  assert.ok(Math.abs(c - 0.7) < 1e-9, `0.8 * 0.7 would punish the longer spelling; got ${c}`);
});

test('a number and a boolean are located as well as a string', () => {
  const num = tokens(['{"fit":', '3', ',"is_spam":', 'false', '}']);
  assert.ok(deriveConfidence(num, 'fit', 3) > 0.9);
  assert.ok(deriveConfidence(num, 'is_spam', false) > 0.9);
});

// Silence beats a wrong number: every caller treats a null as "needs a person".
test('no tokens, a missing key, or a value that does not match reports nothing', () => {
  assert.equal(deriveConfidence(null, 'priority', 'hot'), null);
  assert.equal(deriveConfidence([], 'priority', 'hot'), null);
  assert.equal(deriveConfidence(tokens(['{"other":"hot"}']), 'priority', 'hot'), null);
  assert.equal(deriveConfidence(tokens(['{"priority":"cold"}']), 'priority', 'hot'), null,
    'the scan landed on a different value than the parsed one');
});

// --- jev ------------------------------------------------------------------------------

test('jev: the pack is the request, unrendered', () => {
  const { url, init } = PROVIDERS.jev.request({
    url: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest', apiKey: 'k',
    state: STATE, questions: QUESTIONS,
  });
  assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
  assert.equal(init.headers.Authorization, 'Bearer k');
  assert.deepEqual(JSON.parse(init.body), { model: 'jev-latest', state: STATE, questions: QUESTIONS });
});

test('jev: each answer type reads back, with the model\'s own confidence', () => {
  const out = PROVIDERS.jev.parse({
    model: 'jev-1.13.0',
    answers: {
      priority: { type: 'choice', choice: 'hot', confidence: 0.91, probabilities: { hot: 0.91, cold: 0.09 } },
      fit: { type: 'score', score: 3, confidence: 0.77 },
      is_spam: { type: 'noul', noul: 0.04 },
    },
    usage: { input_tokens: 12, output_tokens: 3 },
  }, QUESTIONS);

  assert.equal(out.model, 'jev-1.13.0');
  assert.deepEqual(out.usage, { input_tokens: 12, output_tokens: 3 });
  assert.equal(out.answers.priority.value, 'hot');
  assert.equal(out.answers.priority.confidence, 0.91);
  assert.deepEqual(out.answers.priority.probabilities, { hot: 0.91, cold: 0.09 });
  assert.equal(out.answers.fit.value, 3);
  assert.equal(out.answers.is_spam.value, false);
  // A noul reports a probability, not a confidence; distance from a coin flip is one.
  assert.ok(Math.abs(out.answers.is_spam.confidence - 0.92) < 1e-9);
});

// --- anthropic ----------------------------------------------------------------------------

test('anthropic: structured output, low effort, and the pack as the cacheable prefix', () => {
  const { url, init } = PROVIDERS.anthropic.request({
    url: 'https://api.anthropic.com/v1/messages', model: 'claude-opus-5', apiKey: 'sk',
    state: STATE, questions: QUESTIONS,
  });
  assert.equal(url, 'https://api.anthropic.com/v1/messages');
  assert.equal(init.headers['x-api-key'], 'sk');
  assert.equal(init.headers['anthropic-version'], '2023-06-01');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'claude-opus-5');
  assert.equal(body.output_config.effort, 'low');
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.deepEqual(body.output_config.format.schema.properties.priority.enum, ['hot', 'cold']);
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' });
  assert.equal(body.messages[0].content, JSON.stringify(STATE));
});

// The headline difference between this adapter and the others, and the reason the runner
// treats a null confidence as "send it to a person" rather than as a pass.
test('anthropic: labels come back, confidence does not', () => {
  const out = PROVIDERS.anthropic.parse({
    model: 'claude-opus-5',
    content: [{ type: 'text', text: '{"priority":"hot","fit":2,"is_spam":false}' }],
    usage: { input_tokens: 400, output_tokens: 20 },
  }, QUESTIONS);
  assert.equal(out.answers.priority.value, 'hot');
  assert.equal(out.answers.fit.value, 2);
  assert.equal(out.answers.is_spam.value, false);
  for (const id of Object.keys(QUESTIONS)) assert.equal(out.answers[id].confidence, null);
  assert.deepEqual(out.usage, { input_tokens: 400, output_tokens: 20 });
});

test('anthropic: a refusal and a missing text block are errors, not empty answers', () => {
  assert.throws(() => PROVIDERS.anthropic.parse(
    { stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'cyber' } }, QUESTIONS),
  (err) => err instanceof ProviderError && /declined/.test(err.message));
  assert.throws(() => PROVIDERS.anthropic.parse({ content: [], stop_reason: 'max_tokens' }, QUESTIONS),
    ProviderError);
  assert.throws(() => PROVIDERS.anthropic.parse({ content: [{ type: 'text', text: 'sure thing!' }] }, QUESTIONS),
    (err) => err instanceof ProviderError && /did not return JSON/.test(err.message));
});

// --- openai --------------------------------------------------------------------------------

test('openai: a strict json_schema and logprobs are both asked for', () => {
  const { init } = PROVIDERS.openai.request({
    url: 'https://api.openai.com/v1/chat/completions', model: 'a-model', apiKey: 'sk',
    state: STATE, questions: QUESTIONS,
  });
  const body = JSON.parse(init.body);
  assert.equal(body.response_format.json_schema.strict, true);
  assert.equal(body.logprobs, true);
  assert.equal(body.top_logprobs, 5);
  assert.equal(body.messages[0].role, 'system');
});

test('openai: confidence is derived per field from the answer\'s own tokens', () => {
  const out = PROVIDERS.openai.parse({
    model: 'a-model',
    choices: [{
      message: { content: '{"priority":"hot","fit":2,"is_spam":false}' },
      logprobs: {
        content: [
          { token: '{"priority":"', logprob: Math.log(0.99) },
          { token: 'hot', logprob: Math.log(0.55) },
          { token: '","fit":', logprob: Math.log(0.99) },
          { token: '2', logprob: Math.log(0.88) },
          { token: ',"is_spam":false}', logprob: Math.log(0.97) },
        ],
      },
    }],
    usage: { prompt_tokens: 300, completion_tokens: 18 },
  }, QUESTIONS);

  assert.equal(out.answers.priority.value, 'hot');
  assert.ok(Math.abs(out.answers.priority.confidence - 0.55) < 1e-9);
  assert.ok(Math.abs(out.answers.fit.confidence - 0.88) < 1e-9);
  assert.deepEqual(out.usage, { input_tokens: 300, output_tokens: 18 });
});

test('openai: no logprobs in the response means no confidence, not a guess', () => {
  const out = PROVIDERS.openai.parse({
    choices: [{ message: { content: '{"priority":"hot","fit":2,"is_spam":false}' } }],
  }, QUESTIONS);
  assert.equal(out.answers.priority.value, 'hot');
  assert.equal(out.answers.priority.confidence, null);
});

// --- gemini ----------------------------------------------------------------------------------

test('gemini: the model rides in the URL and the schema omits additionalProperties', () => {
  const { url, init } = PROVIDERS.gemini.request({
    url: 'https://generativelanguage.googleapis.com/v1beta', model: 'a-model', apiKey: 'k',
    state: STATE, questions: QUESTIONS,
  });
  assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/a-model:generateContent');
  assert.equal(init.headers['x-goog-api-key'], 'k');
  const body = JSON.parse(init.body);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.equal(body.generationConfig.responseLogprobs, true);
  assert.equal('additionalProperties' in body.generationConfig.responseSchema, false);
});

test('gemini: chosen-candidate logprobs become the confidence; their absence becomes null', () => {
  const body = (extra) => ({
    modelVersion: 'a-model',
    candidates: [{
      content: { parts: [{ text: '{"priority":"cold","fit":1,"is_spam":true}' }] },
      ...extra,
    }],
    usageMetadata: { promptTokenCount: 250, candidatesTokenCount: 15 },
  });
  const withLogprobs = PROVIDERS.gemini.parse(body({
    logprobsResult: {
      chosenCandidates: [
        { token: '{"priority":"', logProbability: Math.log(0.99) },
        { token: 'cold', logProbability: Math.log(0.71) },
        { token: '","fit":1,"is_spam":true}', logProbability: Math.log(0.99) },
      ],
    },
  }), QUESTIONS);
  assert.equal(withLogprobs.answers.priority.value, 'cold');
  assert.ok(Math.abs(withLogprobs.answers.priority.confidence - 0.71) < 1e-9);
  assert.deepEqual(withLogprobs.usage, { input_tokens: 250, output_tokens: 15 });

  const without = PROVIDERS.gemini.parse(body({}), QUESTIONS);
  assert.equal(without.answers.priority.value, 'cold');
  assert.equal(without.answers.priority.confidence, null);
});

// --- the contract every adapter owes the runner ------------------------------------------------

test('every provider declares a key variable, a URL and what its confidence means', () => {
  for (const name of PROVIDER_NAMES) {
    const p = PROVIDERS[name];
    assert.equal(p.name, name);
    assert.match(p.keyEnv, /^[A-Z][A-Z0-9_]*$/, `${name} needs a key env var`);
    assert.ok(p.defaultUrl.startsWith('https://'), `${name} needs an https default URL`);
    assert.ok(['calibrated', 'derived', 'none'].includes(p.confidenceBasis), `${name}: ${p.confidenceBasis}`);
    assert.equal(typeof p.request, 'function');
    assert.equal(typeof p.parse, 'function');
  }
});
