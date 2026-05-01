/**
 * Account-lifecycle email templates: verification, password reset,
 * temp passwords, deactivation. Split from emailService.ts so each
 * category can be edited and reviewed without scrolling 3000 lines.
 */
import {
  emailLayout, emailHeader, greeting, para, infoCard, alertBox,
  stepList, ctaButton, passwordResetSteps,
} from '../../emailTemplateBase';
import { PLATFORM } from '@shared/platformConfig';

export const accountTemplates = {
  verification: (data: { firstName: string; verificationUrl: string }) => ({
    subject: `Verify Your ${PLATFORM.name} Account`,
    html: emailLayout({
      preheader: `Please verify your email address to activate your ${PLATFORM.name} account.`,
      header: emailHeader({ title: 'Verify Your Email', subtitle: 'One quick step to activate your account', badge: 'Account Security', theme: 'blue' }),
      body:
        greeting(data.firstName || 'there') +
        para(`Thank you for signing up for ${PLATFORM.name}! To activate your account, please verify your email address.`) +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Verify Email Address', url: data.verificationUrl }) +
        '</td></tr></table>' +
        alertBox({ type: 'info', title: 'Link expires in 24 hours', body: 'For security, this link is only valid for 24 hours. If it expires, you can request a new one from the login page.' }) +
        para(`If you did not create a ${PLATFORM.name} account, you can safely ignore this email.`, { muted: true, small: true }),
    }),
  }),

  passwordReset: (data: { firstName: string; resetUrl: string }) => ({
    subject: `Reset Your ${PLATFORM.name} Password`,
    html: emailLayout({
      preheader: 'We received a request to reset your password. Click below to create a new one.',
      header: emailHeader({ title: 'Password Reset Request', subtitle: 'Secure link to set a new password', badge: 'Security', theme: 'blue' }),
      body:
        greeting(data.firstName || 'there') +
        para(`We received a request to reset the password for your ${PLATFORM.name} account. Follow the steps below to set a new password.`) +
        passwordResetSteps() +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Reset My Password', url: data.resetUrl }) +
        '</td></tr></table>' +
        alertBox({ type: 'danger', title: 'Did not request this?', body: 'If you did not request a password reset, your account may be at risk. Please sign in and change your password immediately, or contact support.' }) +
        para('This link will expire in <strong>1 hour</strong> for your security.', { muted: true, small: true }),
    }),
  }),

  employeeTemporaryPassword: (data: {
    firstName: string;
    email: string;
    tempPassword: string;
    workspaceName: string;
  }) => ({
    subject: `Your ${PLATFORM.name} Account — Login Credentials`,
    html: emailLayout({
      preheader: `Welcome to ${data.workspaceName || PLATFORM.name}! Your temporary login credentials are inside.`,
      header: emailHeader({ title: `Welcome to ${data.workspaceName || PLATFORM.name}`, subtitle: 'Your account has been created', badge: 'Account Created', theme: 'blue' }),
      body:
        greeting(data.firstName || 'there') +
        para(`Your ${PLATFORM.name} account has been created for <strong>${data.workspaceName || 'your organization'}</strong>. Use the credentials below to sign in for the first time.`) +
        infoCard({
          title: 'Your Login Credentials',
          rows: [
            { label: 'Email', value: data.email },
            { label: 'Temporary Password', value: data.tempPassword, highlight: true },
          ],
        }) +
        alertBox({ type: 'warning', title: 'You must change your password on first login', body: 'For your security, you will be required to set a new permanent password immediately after your first sign-in.' }) +
        stepList([
          { title: `Open the ${PLATFORM.name} login page` },
          { title: 'Enter your email and the temporary password above' },
          { title: 'Follow the prompts to create a new secure password' },
          { title: 'Sign in with your new password going forward' },
        ]) +
        para('If you did not expect this email, contact your manager or support immediately.', { muted: true, small: true }),
    }),
  }),

  accountDeactivation: (data: {
    firstName: string;
    reason?: string;
    contactEmail: string;
    reactivateUrl?: string;
  }) => ({
    subject: `Your ${PLATFORM.name} Account Has Been Deactivated`,
    html: emailLayout({
      preheader: 'Your account has been deactivated. Contact support if you believe this is an error.',
      header: emailHeader({ title: 'Account Deactivated', subtitle: 'Access to your account has been suspended', badge: 'Account Notice', theme: 'dark' }),
      body:
        greeting(data.firstName) +
        para(`Your ${PLATFORM.name} account has been deactivated. You will not be able to sign in until the account is reactivated by an administrator.`) +
        (data.reason ? infoCard({ title: 'Deactivation Details', rows: [{ label: 'Reason', value: data.reason }] }) : '') +
        alertBox({ type: 'warning', title: 'What this means', body: 'You will not be able to log in or access your account while it is deactivated. Any active sessions have been ended.' }) +
        alertBox({ type: 'info', title: 'Think this is a mistake?', body: `Contact your administrator or support at <strong>${data.contactEmail}</strong> to request reactivation. Please reference your account email when reaching out.` }) +
        (data.reactivateUrl ? ctaButton({ text: 'Request Reactivation', url: data.reactivateUrl, style: 'dark' }) : '') +
        para('Your data is retained for 90 days after deactivation. Contact us if you need to export your records.', { muted: true, small: true }),
    }),
  }),
};
