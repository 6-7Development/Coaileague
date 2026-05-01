#!/usr/bin/env node
/**
 * SEND ONE EMAIL — minimal proof-of-life that hits the real Resend API.
 *
 *   RESEND_API_KEY=re_test_xxxxxxxxxxxxxxxxxx \
 *   RESEND_FROM_EMAIL=onboarding@resend.dev \
 *   VERIFY_TO=delivered@resend.dev \
 *   node scripts/send-one-email.mjs
 *
 * Defaults:
 *   from = onboarding@resend.dev   (Resend's pre-verified test sender)
 *   to   = delivered@resend.dev    (Resend's "always succeeds" test address)
 *
 * Exits 0 with the Resend message id printed on stdout when the send succeeds,
 * 1 otherwise. No silent paths — any non-2xx response, any missing id, any
 * thrown error is reported with full body and the script exits non-zero.
 */
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('ERROR: RESEND_API_KEY env var is required.');
  console.error('Get a free test key at https://resend.com/api-keys (use re_test_…).');
  process.exit(1);
}

const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const to = process.env.VERIFY_TO || 'delivered@resend.dev';

const subject = `CoAIleague proof-of-life — ${new Date().toISOString()}`;
const html = `
  <h2>CoAIleague email system — proof of life</h2>
  <p>This message was fired by <code>scripts/send-one-email.mjs</code> against
     the same Resend API the platform uses in production.</p>
  <ul>
    <li>From: ${from}</li>
    <li>To: ${to}</li>
    <li>Sent at: ${new Date().toISOString()}</li>
    <li>Key prefix: ${apiKey.slice(0, 8)}…</li>
  </ul>
`;

console.log(`from: ${from}`);
console.log(`to:   ${to}`);
console.log(`key:  ${apiKey.slice(0, 8)}…`);
console.log('POST https://api.resend.com/emails');

const t0 = Date.now();
const resp = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    html,
    text: 'CoAIleague proof of life — see HTML version.',
  }),
});

const elapsed = Date.now() - t0;
const bodyText = await resp.text();
let body;
try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }

console.log(`HTTP ${resp.status} in ${elapsed}ms`);
console.log(JSON.stringify(body, null, 2));

if (!resp.ok || !body?.id) {
  console.error('FAIL: Resend rejected the send or did not return a message id.');
  process.exit(1);
}

console.log(`\nOK: message id ${body.id}`);
process.exit(0);
