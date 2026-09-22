// Backends for the record classifier. One adapter per provider, all answering the same
// question pack and all returning the same normalised answer:
//
//   {value, confidence, probabilities}
//
// The pack is the contract; the provider is a flag. What differs between them -- and the
// only thing that really differs -- is where `confidence` comes from:
//
//   calibrated  jev       The model is trained to report it. A choice also returns the full
//                         distribution over the options. This is the whole reason the
//                         classifier gates on confidence at all.
//   derived     openai    Read back out of the token logprobs of the answer the model just
//               gemini    wrote. Honest, but it is the model's own token probability, not a
//                         calibrated one: it says how sure the decoder was about those
//                         characters, not how often that label is right. Treat the threshold
//                         as a per-question knob you tune against labelled data, never as a
//                         probability of correctness.
//   none        anthropic The Messages API exposes no logprobs, and a self-reported "how
//                         confident are you" number is not calibrated -- models say 0.9 about
//                         everything. So this adapter reports `null` rather than inventing
//                         one, and the runner treats null as "send it to a person". If you
//                         want a real number here, sample the same row N times and use the
//                         agreement rate -- N times the cost, which is a decision for the
//                         caller, not a default.
//
// Every adapter is one request per row carrying the whole pack, so switching providers does
// not change what a run costs in requests, only what it costs per request.
export class ProviderError extends Error {
    constructor(message, detail) { super(message); this.detail = detail; }
}

/**
 * The pack, rendered once as the instruction text. It is identical for every row, which is
 * why it goes in the system position: the row is the only thing that varies, so the prefix
 * is cacheable where the provider caches.
 */
export function packText(questions) {
    const lines = [
        'You are labelling one CRM record. Answer every question below about the record in',
        'the user message, and return ONLY a JSON object keyed by the question ids.',
        '',
    ];
    for (const [id, q] of Object.entries(questions)) {
        lines.push(`## ${id} (${q.type})`, q.instructions);
        if (q.type === 'choice') {
            lines.push('Answer with exactly one of these option names:');
            for (const [option, description] of Object.entries(q.criteria)) {
                lines.push(`- ${option}: ${description}`);
            }
        } else if (q.type === 'score') {
            lines.push(`Answer with the level number (1-${q.criteria.length}):`);
            q.criteria.forEach((level, i) => lines.push(`- ${i + 1}: ${level}`));
        } else {
            lines.push('Answer true or false.');
            if (q.criteria?.true) lines.push(`- true: ${q.criteria.true}`);
            if (q.criteria?.false) lines.push(`- false: ${q.criteria.false}`);
        }
        lines.push('');
    }
    lines.push('Judge only what the record says. Do not infer facts it does not carry.');
    return lines.join('\n');
}

/** One property per question, typed so the provider's own validator enforces the labels. */
export function schemaFor(questions, { additionalProperties = true } = {}) {
    const properties = {};
    for (const [id, q] of Object.entries(questions)) {
        if (q.type === 'choice') properties[id] = { type: 'string', enum: Object.keys(q.criteria) };
        else if (q.type === 'score') properties[id] = { type: 'integer', minimum: 1, maximum: q.criteria.length };
        else properties[id] = { type: 'boolean' };
    }
    const schema = { type: 'object', properties, required: Object.keys(questions) };
    // Gemini's response schema is an OpenAPI subset and rejects the key outright; OpenAI's
    // strict mode requires it. Hence the flag rather than one shape for both.
    if (additionalProperties) schema.additionalProperties = false;
    return schema;
}

/**
 * How sure the decoder was about the characters it wrote for one field.
 *
 * `tokens` is the answer's token stream as {text, logprob}. Concatenated, it IS the JSON, so
 * finding a field's value is a scan of that text and the answer is the weakest token in the
 * span -- the minimum, not the product, because a product punishes a label for being spelled
 * with more tokens than its rivals, which is a property of the tokenizer and not of the
 * judgement.
 */
export function deriveConfidence(tokens, key, value) {
    if (!Array.isArray(tokens) || tokens.length === 0) return null;
    const text = tokens.map((t) => t.text ?? '').join('');
    const at = text.indexOf(`"${key}"`);
    if (at < 0) return null;
    const colon = text.indexOf(':', at + key.length + 2);
    if (colon < 0) return null;

    let start = colon + 1;
    while (start < text.length && /\s/.test(text[start])) start++;
    if (start >= text.length) return null;
    let end;
    if (text[start] === '"') {
        end = text.indexOf('"', start + 1);
        if (end < 0) return null;
        end += 1;                                   // include the closing quote
    } else {
        end = start;
        while (end < text.length && !/[,}\s]/.test(text[end])) end++;
    }
    // A value that is not the one we were handed means the scan landed on the wrong field
    // (a label containing the key's name, say). Report nothing rather than the wrong thing.
    const literal = text.slice(start, end).replace(/^"|"$/g, '');
    if (literal !== String(value)) return null;

    let cursor = 0;
    let worst = null;
    for (const t of tokens) {
        const len = (t.text ?? '').length;
        const overlaps = cursor < end && cursor + len > start;
        if (overlaps && typeof t.logprob === 'number') {
            const p = Math.exp(t.logprob);
            worst = worst === null ? p : Math.min(worst, p);
        }
        cursor += len;
    }
    return worst;
}

/** The parsed JSON plus its token stream -> the normalised answers the runner expects. */
function answersFrom(parsed, questions, tokens) {
    const answers = {};
    for (const id of Object.keys(questions)) {
        const value = parsed?.[id] ?? null;
        answers[id] = {
            value,
            confidence: value === null ? null : deriveConfidence(tokens, id, value),
            probabilities: null,
        };
    }
    return answers;
}

function parseJsonText(text, provider) {
    try { return JSON.parse(text); } catch {
        throw new ProviderError(`${provider}: the model did not return JSON`, { body: String(text).slice(0, 400) });
    }
}

export const PROVIDERS = {
    // TypeSafe's Jev: the pack IS the request. Nothing is rendered to prose, nothing is
    // parsed back out of prose, and the confidence is the model's own.
    jev: {
        name: 'jev',
        keyEnv: 'TYPESAFE_API_KEY',
        urlEnv: 'TYPESAFE_API_URL',
        defaultUrl: 'https://api.typesafe.ai/v1/systemone',
        defaultModel: 'jev-latest',
        confidenceBasis: 'calibrated',
        request({ url, model, apiKey, state, questions }) {
            return {
                url,
                init: {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, state, questions }),
                },
            };
        },
        parse(json, questions) {
            const answers = {};
            for (const id of Object.keys(questions)) {
                const a = json?.answers?.[id];
                let value = null;
                if (a?.type === 'choice') value = a.choice ?? null;
                else if (a?.type === 'score') value = a.score ?? null;
                else if (typeof a?.noul === 'number') value = a.noul >= 0.5;
                let confidence = typeof a?.confidence === 'number' ? a.confidence : null;
                // A noul reports a probability, not a confidence; how far it sits from a coin
                // flip is one.
                if (confidence === null && typeof a?.noul === 'number') confidence = Math.abs(2 * a.noul - 1);
                answers[id] = { value, confidence, probabilities: a?.probabilities ?? null };
            }
            return {
                model: json?.model ?? null,
                usage: {
                    input_tokens: Number(json?.usage?.input_tokens) || 0,
                    output_tokens: Number(json?.usage?.output_tokens) || 0,
                },
                answers,
            };
        },
    },

    // Anthropic Messages API, with structured outputs holding the answer to the pack's own
    // labels. Effort is `low` because this is a classification, not a reasoning task -- and
    // thinking is left at the model's default rather than disabled, which on Opus 5 costs
    // less than it saves.
    anthropic: {
        name: 'anthropic',
        keyEnv: 'ANTHROPIC_API_KEY',
        urlEnv: 'ANTHROPIC_API_URL',
        defaultUrl: 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-opus-5',
        confidenceBasis: 'none',
        request({ url, model, apiKey, state, questions }) {
            return {
                url,
                init: {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: 2048,
                        // The pack is identical on every row, so it is the cacheable prefix.
                        // A small pack falls under the minimum and simply won't cache; that
                        // costs nothing.
                        system: [{ type: 'text', text: packText(questions), cache_control: { type: 'ephemeral' } }],
                        messages: [{ role: 'user', content: JSON.stringify(state) }],
                        output_config: {
                            effort: 'low',
                            format: { type: 'json_schema', schema: schemaFor(questions) },
                        },
                    }),
                },
            };
        },
        parse(json, questions) {
            if (json?.stop_reason === 'refusal') {
                throw new ProviderError('anthropic: the request was declined by a safety classifier',
                    { stop_details: json.stop_details ?? null });
            }
            const text = json?.content?.find?.((b) => b.type === 'text')?.text;
            if (text === undefined) {
                throw new ProviderError('anthropic: no text block in the response',
                    { stop_reason: json?.stop_reason ?? null });
            }
            const parsed = parseJsonText(text, 'anthropic');
            return {
                model: json?.model ?? null,
                usage: {
                    input_tokens: Number(json?.usage?.input_tokens) || 0,
                    output_tokens: Number(json?.usage?.output_tokens) || 0,
                },
                // No logprobs on this API, so no confidence -- see the header.
                answers: answersFrom(parsed, questions, null),
            };
        },
    },

    // OpenAI chat completions. `logprobs` is what earns this adapter its confidence column.
    // No model default: OpenAI's ids turn over, and a wrong guess is a 404 on every row.
    openai: {
        name: 'openai',
        keyEnv: 'OPENAI_API_KEY',
        urlEnv: 'OPENAI_API_URL',
        defaultUrl: 'https://api.openai.com/v1/chat/completions',
        defaultModel: null,
        confidenceBasis: 'derived',
        request({ url, model, apiKey, state, questions }) {
            return {
                url,
                init: {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: packText(questions) },
                            { role: 'user', content: JSON.stringify(state) },
                        ],
                        response_format: {
                            type: 'json_schema',
                            json_schema: { name: 'labels', strict: true, schema: schemaFor(questions) },
                        },
                        logprobs: true,
                        top_logprobs: 5,
                    }),
                },
            };
        },
        parse(json, questions) {
            const choice = json?.choices?.[0];
            const text = choice?.message?.content;
            if (text === undefined || text === null) {
                throw new ProviderError('openai: no message content in the response',
                    { finish_reason: choice?.finish_reason ?? null });
            }
            const parsed = parseJsonText(text, 'openai');
            const tokens = (choice?.logprobs?.content ?? []).map((t) => ({ text: t.token, logprob: t.logprob }));
            return {
                model: json?.model ?? null,
                usage: {
                    input_tokens: Number(json?.usage?.prompt_tokens) || 0,
                    output_tokens: Number(json?.usage?.completion_tokens) || 0,
                },
                answers: answersFrom(parsed, questions, tokens),
            };
        },
    },

    // Google Gemini. Same trade as OpenAI: a response schema for the labels, logprobs for the
    // confidence. The URL carries the model, so it is built per request. No model default,
    // for the same reason as OpenAI.
    gemini: {
        name: 'gemini',
        keyEnv: 'GEMINI_API_KEY',
        urlEnv: 'GEMINI_API_URL',
        defaultUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: null,
        confidenceBasis: 'derived',
        request({ url, model, apiKey, state, questions }) {
            return {
                url: `${url.replace(/\/+$/, '')}/models/${encodeURIComponent(model)}:generateContent`,
                init: {
                    method: 'POST',
                    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: packText(questions) }] },
                        contents: [{ role: 'user', parts: [{ text: JSON.stringify(state) }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            responseSchema: schemaFor(questions, { additionalProperties: false }),
                            responseLogprobs: true,
                            logprobs: 5,
                        },
                    }),
                },
            };
        },
        parse(json, questions) {
            const candidate = json?.candidates?.[0];
            const text = candidate?.content?.parts?.map?.((p) => p.text ?? '').join('');
            if (!text) {
                throw new ProviderError('gemini: no text part in the response',
                    { finish_reason: candidate?.finishReason ?? null });
            }
            const parsed = parseJsonText(text, 'gemini');
            // Best effort: when the account or model does not return logprobs, the field is
            // simply absent and every confidence comes back null -- which the runner then
            // treats as "needs a person", the safe direction.
            const chosen = candidate?.logprobsResult?.chosenCandidates ?? [];
            const tokens = chosen.map((t) => ({ text: t.token, logprob: t.logProbability }));
            return {
                model: json?.modelVersion ?? null,
                usage: {
                    input_tokens: Number(json?.usageMetadata?.promptTokenCount) || 0,
                    output_tokens: Number(json?.usageMetadata?.candidatesTokenCount) || 0,
                },
                answers: answersFrom(parsed, questions, tokens),
            };
        },
    },
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS);
