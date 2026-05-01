/**
 * Billing-lifecycle email templates: subscription welcome, cancellation,
 * payment failure. Split from emailService.ts.
 */
import {
  emailLayout, emailHeader, greeting, para, infoCard, alertBox, ctaButton,
} from '../../emailTemplateBase';

export const billingTemplates = {
  subscriptionWelcome: (data: {
    firstName: string;
    planName: string;
    workspaceName: string;
    billingCycleEnd: string;
    dashboardUrl: string;
  }) => ({
    subject: `Subscription Activated — Welcome to ${data.planName}`,
    html: emailLayout({
      preheader: `Your ${data.planName} subscription for ${data.workspaceName} is now active.`,
      header: emailHeader({ title: 'Subscription Activated!', subtitle: `${data.planName} is now active for ${data.workspaceName}`, badge: 'Billing', theme: 'blue' }),
      body:
        greeting(data.firstName) +
        para(`Your <strong>${data.planName}</strong> subscription for <strong>${data.workspaceName}</strong> is now active. All premium features are unlocked and ready to use.`) +
        infoCard({
          title: 'Subscription Details',
          rows: [
            { label: 'Plan', value: data.planName, highlight: true },
            { label: 'Organization', value: data.workspaceName },
            { label: 'Next Billing Date', value: data.billingCycleEnd },
          ],
        }) +
        alertBox({ type: 'success', title: 'All premium features are unlocked', body: 'You now have full access to AI automation, advanced reporting, unlimited employees, and priority support.' }) +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Go to Dashboard', url: data.dashboardUrl, style: 'success' }) +
        '</td></tr></table>' +
        para('Your subscription renews automatically. Manage billing settings from your account dashboard anytime.', { muted: true, small: true }),
    }),
  }),

  subscriptionCancellation: (data: {
    firstName: string;
    planName: string;
    workspaceName: string;
    accessUntil: string;
    resubscribeUrl: string;
  }) => ({
    subject: `Subscription Cancelled — ${data.workspaceName}`,
    html: emailLayout({
      preheader: `Your ${data.planName} subscription has been cancelled. Access continues until ${data.accessUntil}.`,
      header: emailHeader({ title: 'Subscription Cancelled', subtitle: 'Your subscription has been cancelled', badge: 'Billing Notice', theme: 'dark' }),
      body:
        greeting(data.firstName) +
        para(`Your <strong>${data.planName}</strong> subscription for <strong>${data.workspaceName}</strong> has been cancelled as requested.`) +
        infoCard({
          rows: [
            { label: 'Plan', value: data.planName },
            { label: 'Organization', value: data.workspaceName },
            { label: 'Access Until', value: data.accessUntil, highlight: true },
          ],
        }) +
        alertBox({ type: 'warning', title: `Your data and access remain until ${data.accessUntil}`, body: 'After this date, your account will be downgraded to the free tier. Your data will be retained for 90 days.' }) +
        para('We are sorry to see you go. If there was anything we could have done better, please reply to this email.') +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Reactivate Subscription', url: data.resubscribeUrl, style: 'dark' }) +
        '</td></tr></table>' +
        para('Changed your mind? Reactivate anytime before your access ends to continue without interruption.', { muted: true, small: true }),
    }),
  }),

  paymentFailed: (data: {
    firstName: string;
    planName: string;
    workspaceName: string;
    amountDue: string;
    nextAttempt?: string;
    updateBillingUrl: string;
  }) => ({
    subject: `Action Required: Payment Failed for ${data.workspaceName}`,
    html: emailLayout({
      preheader: `Your payment for ${data.planName} could not be processed. Update billing details now.`,
      header: emailHeader({ title: 'Payment Failed', subtitle: 'Action required to maintain your subscription', badge: 'Billing Alert', theme: 'red' }),
      body:
        greeting(data.firstName) +
        para('We were unable to process your subscription payment. Please update your billing information to avoid any interruption to your service.') +
        infoCard({
          rows: [
            { label: 'Plan', value: data.planName },
            { label: 'Organization', value: data.workspaceName },
            { label: 'Amount Due', value: `$${data.amountDue}`, highlight: true },
            ...(data.nextAttempt ? [{ label: 'Next Retry', value: data.nextAttempt }] : []),
          ],
        }) +
        alertBox({ type: 'danger', title: 'Avoid service interruption', body: 'Update your payment method now to prevent your subscription from being suspended. We will automatically retry the charge after your billing is updated.' }) +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Update Payment Method', url: data.updateBillingUrl, style: 'danger' }) +
        '</td></tr></table>' +
        para('Common causes: expired card, insufficient funds, or bank blocking the charge. Contact your bank if the problem persists.', { muted: true, small: true }),
    }),
  }),
};
