/**
 * SMS Notification Service - Twilio Integration
 * Sends SMS notifications for schedule changes, reminders, and alerts
 * 
 * Phase 2D: Enhanced with preference-aware sending and AI Brain integration
 */

import { db } from '../db';
import { employees, users, userNotificationPreferences, aiEventStream } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isFeatureEnabled } from '@shared/platformConfig';

interface SMSMessage {
  to: string;
  body: string;
  workspaceId?: string;
  userId?: string;
  type?: string;
  metadata?: Record<string, any>;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

interface SMSTemplate {
  type: string;
  message: string;
  category: 'shift_reminder' | 'schedule_change' | 'approval' | 'clock_reminder' | 'invoice' | 'general';
}

const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  shift_reminder: {
    type: 'shift_reminder',
    message: 'CoAIleague Reminder: You have a shift on {date} at {time}{location}. Reply STOP to unsubscribe.',
    category: 'shift_reminder',
  },
  shift_reminder_soon: {
    type: 'shift_reminder_soon',
    message: 'CoAIleague: Your shift starts in {minutes} minutes{location}. Reply STOP to unsubscribe.',
    category: 'shift_reminder',
  },
  schedule_added: {
    type: 'schedule_added',
    message: 'CoAIleague: New shift assigned - {details}. Check your schedule for details.',
    category: 'schedule_change',
  },
  schedule_removed: {
    type: 'schedule_removed', 
    message: 'CoAIleague: Shift cancelled - {details}. Check your schedule for updates.',
    category: 'schedule_change',
  },
  schedule_modified: {
    type: 'schedule_modified',
    message: 'CoAIleague: Schedule update - {details}. Check your schedule for details.',
    category: 'schedule_change',
  },
  approval_needed: {
    type: 'approval_needed',
    message: 'CoAIleague: Action required - {itemType} needs your approval. Check the app for details.',
    category: 'approval',
  },
  approval_approved: {
    type: 'approval_approved',
    message: 'CoAIleague: Your {itemType} has been approved{details}.',
    category: 'approval',
  },
  approval_rejected: {
    type: 'approval_rejected',
    message: 'CoAIleague: Your {itemType} requires attention{details}. Check the app for details.',
    category: 'approval',
  },
  clock_in_reminder: {
    type: 'clock_in_reminder',
    message: 'CoAIleague: Reminder to clock in for your {time} shift.',
    category: 'clock_reminder',
  },
  clock_out_reminder: {
    type: 'clock_out_reminder',
    message: "CoAIleague: Don't forget to clock out from your shift.",
    category: 'clock_reminder',
  },
  timesheet_submitted: {
    type: 'timesheet_submitted',
    message: 'CoAIleague: Timesheet for {period} submitted successfully.',
    category: 'general',
  },
  pto_request_submitted: {
    type: 'pto_request_submitted',
    message: 'CoAIleague: Time off request for {dates} submitted. Awaiting approval.',
    category: 'approval',
  },
  pto_approved: {
    type: 'pto_approved',
    message: 'CoAIleague: Your time off request for {dates} has been approved.',
    category: 'approval',
  },
  pto_denied: {
    type: 'pto_denied',
    message: 'CoAIleague: Your time off request for {dates} was not approved. Check app for details.',
    category: 'approval',
  },
};

let twilioClient: any = null;

async function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = await import('twilio');
      twilioClient = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } catch (error) {
      console.error('[SMS] Failed to initialize Twilio client:', error);
    }
  }
  return twilioClient;
}

export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  if (!isFeatureEnabled('enableSMSNotifications')) {
    console.log('[SMS] SMS notifications disabled by feature flag');
    return { success: false, error: 'SMS notifications disabled' };
  }

  const client = await getTwilioClient();
  
  if (!client) {
    console.log('[SMS] Twilio client not configured - skipping SMS');
    return { success: false, error: 'Twilio not configured' };
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.log('[SMS] TWILIO_PHONE_NUMBER not set');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  try {
    const result = await client.messages.create({
      body: message.body,
      to: message.to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`[SMS] Sent to ${message.to}: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('[SMS] Failed to send:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendSMSToUser(userId: string, body: string, type: string = 'notification'): Promise<SMSResult> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.phone) {
      return { success: false, error: 'User has no phone number' };
    }

    return sendSMS({
      to: user.phone,
      body,
      userId,
      type,
    });
  } catch (error: any) {
    console.error('[SMS] Error sending to user:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSMSToEmployee(employeeId: string, body: string, type: string = 'notification', workspaceId?: string): Promise<SMSResult> {
  try {
    const employee = await db.query.employees.findFirst({
      where: workspaceId 
        ? and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId))
        : eq(employees.id, employeeId),
    });

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    if (!employee.phone) {
      return { success: false, error: 'Employee has no phone number' };
    }

    return sendSMS({
      to: employee.phone,
      body,
      type,
    });
  } catch (error: any) {
    console.error('[SMS] Error sending to employee:', error);
    return { success: false, error: error.message };
  }
}

export async function sendShiftReminder(
  employeeId: string,
  shiftDate: string,
  shiftTime: string,
  location?: string,
  workspaceId?: string
): Promise<SMSResult> {
  const message = location
    ? `CoAIleague Reminder: You have a shift on ${shiftDate} at ${shiftTime} at ${location}. Reply STOP to unsubscribe.`
    : `CoAIleague Reminder: You have a shift on ${shiftDate} at ${shiftTime}. Reply STOP to unsubscribe.`;
  
  return sendSMSToEmployee(employeeId, message, 'shift_reminder', workspaceId);
}

export async function sendScheduleChangeNotification(
  employeeId: string,
  changeType: 'added' | 'removed' | 'modified',
  shiftDetails: string,
  workspaceId?: string
): Promise<SMSResult> {
  const messages = {
    added: `CoAIleague: New shift assigned - ${shiftDetails}. Check your schedule for details.`,
    removed: `CoAIleague: Shift cancelled - ${shiftDetails}. Check your schedule for updates.`,
    modified: `CoAIleague: Schedule update - ${shiftDetails}. Check your schedule for details.`,
  };
  
  return sendSMSToEmployee(employeeId, messages[changeType], 'schedule_change', workspaceId);
}

export async function sendApprovalNotification(
  userId: string,
  itemType: 'timesheet' | 'time_off' | 'expense',
  status: 'approved' | 'rejected',
  details?: string
): Promise<SMSResult> {
  const statusText = status === 'approved' ? 'approved' : 'requires attention';
  const message = `CoAIleague: Your ${itemType.replace('_', ' ')} has been ${statusText}${details ? ` - ${details}` : ''}`;
  
  return sendSMSToUser(userId, message, `${itemType}_${status}`);
}

export async function sendClockReminder(
  employeeId: string,
  reminderType: 'clock_in' | 'clock_out',
  shiftTime: string
): Promise<SMSResult> {
  const messages = {
    clock_in: `CoAIleague: Reminder to clock in for your ${shiftTime} shift.`,
    clock_out: `CoAIleague: Don't forget to clock out from your shift.`,
  };
  
  return sendSMSToEmployee(employeeId, messages[reminderType], reminderType);
}

export async function sendInvoiceReminder(
  clientPhone: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string
): Promise<SMSResult> {
  const message = `CoAIleague: Invoice ${invoiceNumber} for ${amount} is due ${dueDate}. View and pay online at your client portal.`;
  
  return sendSMS({
    to: clientPhone,
    body: message,
    type: 'invoice_reminder',
  });
}

export async function sendPaymentConfirmation(
  clientPhone: string,
  invoiceNumber: string,
  amount: string
): Promise<SMSResult> {
  const message = `CoAIleague: Payment of ${amount} received for invoice ${invoiceNumber}. Thank you!`;
  
  return sendSMS({
    to: clientPhone,
    body: message,
    type: 'payment_confirmation',
  });
}

export function isSMSConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Check if a user has SMS enabled in their preferences
 */
export async function isUserSmsEnabled(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const [prefs] = await db
      .select()
      .from(userNotificationPreferences)
      .where(and(
        eq(userNotificationPreferences.userId, userId),
        eq(userNotificationPreferences.workspaceId, workspaceId)
      ));
    
    return prefs?.enableSms === true && prefs?.smsOptOut !== true;
  } catch (error) {
    console.error('[SMS] Error checking user SMS preferences:', error);
    return false;
  }
}

/**
 * Get user's SMS phone number from preferences
 */
export async function getUserSmsPhone(userId: string, workspaceId: string): Promise<string | null> {
  try {
    const [prefs] = await db
      .select()
      .from(userNotificationPreferences)
      .where(and(
        eq(userNotificationPreferences.userId, userId),
        eq(userNotificationPreferences.workspaceId, workspaceId)
      ));
    
    if (prefs?.smsPhoneNumber) {
      return prefs.smsPhoneNumber;
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    return user?.phone || null;
  } catch (error) {
    console.error('[SMS] Error getting user SMS phone:', error);
    return null;
  }
}

/**
 * Check if user should receive notifications of a specific category via SMS
 */
export async function shouldSendSmsForCategory(
  userId: string, 
  workspaceId: string, 
  category: 'shift_reminder' | 'schedule_change' | 'approval' | 'clock_reminder' | 'invoice' | 'general'
): Promise<boolean> {
  try {
    const [prefs] = await db
      .select()
      .from(userNotificationPreferences)
      .where(and(
        eq(userNotificationPreferences.userId, userId),
        eq(userNotificationPreferences.workspaceId, workspaceId)
      ));
    
    if (!prefs || !prefs.enableSms || prefs.smsOptOut) {
      return false;
    }
    
    let channels: string[] = [];
    switch (category) {
      case 'shift_reminder':
        channels = prefs.shiftReminderChannels as string[] || ['push', 'email'];
        break;
      case 'schedule_change':
        channels = prefs.scheduleChangeChannels as string[] || ['push', 'email'];
        break;
      case 'approval':
        channels = prefs.approvalNotificationChannels as string[] || ['push', 'email'];
        break;
      default:
        channels = ['push', 'email'];
    }
    
    return channels.includes('sms');
  } catch (error) {
    console.error('[SMS] Error checking category preference:', error);
    return false;
  }
}

/**
 * Send SMS with template substitution
 */
export async function sendTemplatedSMS(
  templateKey: string,
  to: string,
  variables: Record<string, string>,
  options?: { workspaceId?: string; userId?: string }
): Promise<SMSResult> {
  const template = SMS_TEMPLATES[templateKey];
  if (!template) {
    return { success: false, error: `Template '${templateKey}' not found` };
  }
  
  let message = template.message;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  
  return sendSMS({
    to,
    body: message,
    type: template.type,
    workspaceId: options?.workspaceId,
    userId: options?.userId,
    metadata: { template: templateKey, variables },
  });
}

/**
 * Send preference-aware SMS to user - checks preferences before sending
 */
export async function sendPreferenceAwareSMS(
  userId: string,
  workspaceId: string,
  templateKey: string,
  variables: Record<string, string>
): Promise<SMSResult> {
  const template = SMS_TEMPLATES[templateKey];
  if (!template) {
    return { success: false, error: `Template '${templateKey}' not found` };
  }
  
  const shouldSend = await shouldSendSmsForCategory(userId, workspaceId, template.category);
  if (!shouldSend) {
    return { success: false, error: 'User has SMS disabled for this category' };
  }
  
  const phone = await getUserSmsPhone(userId, workspaceId);
  if (!phone) {
    return { success: false, error: 'User has no phone number configured' };
  }
  
  return sendTemplatedSMS(templateKey, phone, variables, { workspaceId, userId });
}

/**
 * Log SMS delivery event for AI Brain tracking
 */
export async function logSmsDeliveryEvent(
  userId: string,
  workspaceId: string,
  messageId: string,
  templateType: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await db.insert(aiEventStream).values({
      workspaceId,
      eventType: 'sms_delivery',
      source: 'sms_service',
      payload: {
        userId,
        messageId,
        templateType,
        success,
        error,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[SMS] Failed to log delivery event:', err);
  }
}

/**
 * Send approval needed SMS
 */
export async function sendApprovalNeededSMS(
  userId: string,
  workspaceId: string,
  itemType: string,
  itemId: string
): Promise<SMSResult> {
  return sendPreferenceAwareSMS(userId, workspaceId, 'approval_needed', {
    itemType: itemType.replace(/_/g, ' '),
    itemId,
  });
}

/**
 * Send PTO approved SMS
 */
export async function sendPTOApprovedSMS(
  userId: string,
  workspaceId: string,
  dates: string
): Promise<SMSResult> {
  return sendPreferenceAwareSMS(userId, workspaceId, 'pto_approved', { dates });
}

/**
 * Send PTO denied SMS
 */
export async function sendPTODeniedSMS(
  userId: string,
  workspaceId: string,
  dates: string
): Promise<SMSResult> {
  return sendPreferenceAwareSMS(userId, workspaceId, 'pto_denied', { dates });
}

/**
 * Send shift reminder SMS (preference-aware)
 */
export async function sendShiftReminderSMSWithPrefs(
  userId: string,
  workspaceId: string,
  shiftDate: string,
  shiftTime: string,
  minutesBefore: number,
  location?: string
): Promise<SMSResult> {
  if (minutesBefore <= 60) {
    return sendPreferenceAwareSMS(userId, workspaceId, 'shift_reminder_soon', {
      minutes: minutesBefore.toString(),
      location: location ? ` at ${location}` : '',
    });
  }
  
  return sendPreferenceAwareSMS(userId, workspaceId, 'shift_reminder', {
    date: shiftDate,
    time: shiftTime,
    location: location ? ` at ${location}` : '',
  });
}

export const smsService = {
  sendSMS,
  sendSMSToUser,
  sendSMSToEmployee,
  sendShiftReminder,
  sendScheduleChangeNotification,
  sendApprovalNotification,
  sendClockReminder,
  sendInvoiceReminder,
  sendPaymentConfirmation,
  isSMSConfigured,
  isUserSmsEnabled,
  getUserSmsPhone,
  shouldSendSmsForCategory,
  sendTemplatedSMS,
  sendPreferenceAwareSMS,
  logSmsDeliveryEvent,
  sendApprovalNeededSMS,
  sendPTOApprovedSMS,
  sendPTODeniedSMS,
  sendShiftReminderSMSWithPrefs,
  SMS_TEMPLATES,
};
