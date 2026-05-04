/**
 * TRANSFER EXTENSION — Trinity Voice Phone System
 * Handles warm transfers to live agents / supervisors
 */

import { twiml, logCallAction } from '../voiceOrchestrator';
import { createLogger } from '../../../lib/logger';
const log = createLogger('transferExtension');


const say = (text: string, lang: 'en' | 'es' = 'en') =>
  lang === 'es'
    ? `<Say voice="Polly.Lupe-Neural" language="es-US">${text}</Say>`
    : `<Say voice="Polly.Joanna-Neural" language="en-US">${text}</Say>`;

export function handleTransfer(params: {
  callSid: string;
  sessionId: string;
  workspaceId: string;
  lang: 'en' | 'es';
  transferTo: string;
  reason?: string;
}): string {
  const { sessionId, workspaceId, lang, transferTo, reason } = params;

  logCallAction({
    callSessionId: sessionId,
    workspaceId,
    action: 'transfer',
    payload: { transferTo, reason },
    outcome: 'initiated',
  }).catch((err) => log.warn('[transferExtension] Fire-and-forget failed:', err));

  const connectingMsg = lang === 'es'
    ? 'Le conecto ahora mismo. Por favor espere un momento.'
    : 'I am connecting you now. Please hold for just a moment.';
  const failMsg = lang === 'es'
    ? 'Lo sentimos, no pude conectarle en este momento. Por favor llame de nuevo o deje un mensaje y alguien le contactará pronto.'
    : 'I was not able to connect you just now. Please try calling back or leave a message and someone will follow up with you shortly.';

  return twiml(
    say(connectingMsg, lang) +
    `<Dial timeout="30" callerId="${transferTo}"><Number>${transferTo}</Number></Dial>` +
    say(failMsg, lang)
  );
}
