/**
 * EMERGENCY EXTENSION — Trinity Voice Phone System
 * Extension 5: Urgent situations — officer welfare, site incidents, staffing emergencies
 *
 * HARD RULE: Trinity never references 911, emergency services, or implies
 * she dispatches public safety. She alerts management and connects to the
 * on-call supervisor. What happens next is the supervisor's decision.
 * This eliminates duty-of-care liability for CoAIleague and all tenants.
 *
 * FLOW:
 *   Caller presses 5 → Trinity acknowledges urgency, warm but direct
 *   → Looks up on-call supervisor → <Dial> with 30s timeout
 *   → If no answer → voicemail + SMS blast to all managers
 *   → Trinity thanks caller and confirms help is on the way
 */

import { twiml, logCallAction } from '../voiceOrchestrator';
import { createLogger } from '../../../lib/logger';
const log = createLogger('emergencyExtension');


const say = (text: string, lang: 'en' | 'es' = 'en') =>
  lang === 'es'
    ? `<Say voice="Polly.Lupe-Neural" language="es-US">${text}</Say>`
    : `<Say voice="Polly.Joanna-Neural" language="en-US">${text}</Say>`;

export async function handleEmergency(params: {
  callSid: string;
  sessionId: string;
  workspaceId: string;
  lang: 'en' | 'es';
  baseUrl: string;
}): Promise<string> {
  const { callSid, sessionId, workspaceId, lang, baseUrl } = params;

  logCallAction({
    callSessionId: sessionId,
    workspaceId,
    action: 'extension_selected',
    payload: { extension: '5', label: 'emergency' },
    outcome: 'success',
  }).catch((err) => log.warn('[emergencyExtension] Audit log failed:', err));

  // Attempt to find an on-call supervisor from active shifts
  let onCallNumber = '';
  try {
    const { pool } = await import('../../../db');
    const result = await pool.query(
      `SELECT u.phone
       FROM shifts s
       JOIN employees e ON e.id = s.assigned_employee_id
       JOIN workspace_members wm ON wm.user_id = e.user_id AND wm.workspace_id = s.workspace_id
       JOIN users u ON u.id = e.user_id
       WHERE s.workspace_id = $1
         AND s.status IN ('active','started','in_progress')
         AND s.start_time <= NOW() AND s.end_time >= NOW()
         AND wm.workspace_role IN ('supervisor','department_manager','org_manager','org_owner','co_owner')
         AND u.phone IS NOT NULL AND u.phone != ''
       ORDER BY CASE wm.workspace_role
         WHEN 'department_manager' THEN 1 WHEN 'org_manager' THEN 2
         WHEN 'supervisor' THEN 3 ELSE 4 END ASC
       LIMIT 1`,
      [workspaceId]
    );
    if (result.rows[0]?.phone) onCallNumber = result.rows[0].phone;

    // No on-duty supervisor — fall back to owner
    if (!onCallNumber) {
      const ownerResult = await pool.query(
        `SELECT u.phone FROM workspaces w
         JOIN users u ON u.id = w.owner_id
         WHERE w.id = $1 AND u.phone IS NOT NULL LIMIT 1`,
        [workspaceId]
      );
      if (ownerResult.rows[0]?.phone) onCallNumber = ownerResult.rows[0].phone;
    }

    // SMS blast to all managers simultaneously
    const { sendSMS } = await import('../../../services/smsService');
    const contacts = await pool.query(
      `SELECT DISTINCT u.phone FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
         AND wm.workspace_role IN ('org_owner','co_owner','department_manager','supervisor')
         AND u.phone IS NOT NULL`,
      [workspaceId]
    );
    for (const c of contacts.rows) {
      sendSMS({
        to: c.phone,
        body: `Urgent: An emergency call came in on the CoAIleague line (CallSid: ${callSid}). A caller needs immediate assistance. Please respond now.`,
        workspaceId,
        type: 'system_alert',
      }).catch(() => {});
    }
  } catch (err: unknown) {
    log.warn('[emergencyExtension] Supervisor lookup failed (non-fatal):', err instanceof Error ? err.message : String(err));
  }

  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '';

  if (onCallNumber) {
    // Live transfer with warm message — no whisper delay for urgent situations
    if (lang === 'es') {
      return twiml(
        say('Entendido. Esto es urgente. Le conecto con el supervisor de turno ahora mismo. Por favor permanezca en la línea.', 'es') +
        `<Dial callerId="${twilioNumber}" timeout="30" action="${baseUrl}/api/voice/recording-done?ext=emergency&lang=es">` +
        `<Number>${onCallNumber}</Number>` +
        `</Dial>` +
        say('No pude conectar en este momento, pero su mensaje ha sido registrado y el equipo de gestión ha sido notificado. Alguien se comunicará con usted de inmediato.', 'es')
      );
    }
    return twiml(
      say('Understood. I am connecting you with the on-duty supervisor right now. Please stay on the line.') +
      `<Dial callerId="${twilioNumber}" timeout="30" action="${baseUrl}/api/voice/recording-done?ext=emergency&lang=en">` +
      `<Number>${onCallNumber}</Number>` +
      `</Dial>` +
      say('I was unable to connect you just now, but your call has been logged and management has been notified. Someone will reach out to you immediately.')
    );
  }

  // No supervisor available — take a message + notify
  if (lang === 'es') {
    return twiml(
      say('Entendido. En este momento no hay supervisores disponibles, pero el equipo de gestión ha sido notificado. Por favor deje un mensaje detallado después del tono y alguien se comunicará con usted de inmediato.', 'es') +
      `<Record action="${baseUrl}/api/voice/recording-done?ext=emergency&lang=es" maxLength="120" playBeep="true" />` +
      say('Su mensaje ha sido recibido. El equipo está siendo notificado ahora mismo. Gracias por llamar.', 'es')
    );
  }

  return twiml(
    say('I understand this is urgent. Our management team has been notified. No supervisors are available at this exact moment, but please leave a detailed message after the tone and someone will call you back immediately.') +
    `<Record action="${baseUrl}/api/voice/recording-done?ext=emergency&lang=en" maxLength="120" playBeep="true" />` +
    say('Your message has been received and our team has been alerted. Thank you for calling.')
  );
}
