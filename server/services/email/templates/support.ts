/**
 * Support / system-notice email templates: support tickets, report
 * delivery, scheduled & emergency maintenance. Split from emailService.ts.
 */
import {
  emailLayout, emailHeader, greeting, para, infoCard, alertBox,
  checkList, ctaButton, sectionHeading,
} from '../../emailTemplateBase';
import { PLATFORM } from '@shared/platformConfig';

export const supportTemplates = {
  supportTicketConfirmation: (data: { name: string; ticketNumber: string; subject: string; ticketUrl?: string }) => ({
    subject: `Support Ticket Created — ${data.ticketNumber}`,
    html: emailLayout({
      preheader: `Your support request ${data.ticketNumber} has been received.`,
      header: emailHeader({ title: 'Support Request Received', subtitle: 'Your ticket has been logged', badge: 'Support', theme: 'purple' }),
      body:
        greeting(data.name || 'there') +
        para(`Thank you for contacting ${PLATFORM.name} Support. Your request has been received and our team will respond as soon as possible.`) +
        infoCard({
          title: 'Ticket Details',
          rows: [
            { label: 'Ticket Number', value: data.ticketNumber, highlight: true },
            { label: 'Subject', value: data.subject },
            { label: 'Status', value: 'Open — Awaiting Review' },
          ],
        }) +
        (data.ticketUrl ? ctaButton({ text: 'View Your Support Ticket', url: data.ticketUrl, style: 'purple' }) : '') +
        alertBox({ type: 'info', title: 'Save your ticket number', body: `Reference <strong>${data.ticketNumber}</strong> when following up. You can check status via Live Chat in the platform.` }) +
        para('Our support team typically responds within 1 business day.', { muted: true }),
    }),
  }),

  reportDelivery: (data: { clientName: string; reportNumber: string; reportTitle: string; reportUrl?: string }) => ({
    subject: `Report Ready — ${data.reportNumber}`,
    html: emailLayout({
      preheader: `Your report "${data.reportTitle}" is ready for review.`,
      header: emailHeader({ title: 'Report Ready for Review', subtitle: 'A new report has been completed', badge: 'Reports', theme: 'blue' }),
      body:
        greeting(data.clientName || 'there') +
        para('A new report has been completed and is ready for your review in the portal.') +
        infoCard({
          rows: [
            { label: 'Report Number', value: data.reportNumber, highlight: true },
            { label: 'Title', value: data.reportTitle },
          ],
        }) +
        (data.reportUrl ? ctaButton({ text: 'View Full Report', url: data.reportUrl }) : '') +
        para(`Please log in to your ${PLATFORM.name} portal to view the full report and download a copy.`, { muted: true }),
    }),
  }),

  maintenanceNotification: (data: {
    firstName: string;
    maintenanceWindow: string;
    duration: string;
    affectedServices: string[];
    maintenanceType: 'scheduled' | 'emergency';
  }) => ({
    subject: `${data.maintenanceType === 'emergency' ? 'Emergency' : 'Scheduled'} Maintenance — ${PLATFORM.name}`,
    html: emailLayout({
      preheader: `${PLATFORM.name} will be undergoing ${data.maintenanceType} maintenance on ${data.maintenanceWindow}.`,
      header: emailHeader({
        title: data.maintenanceType === 'emergency' ? 'Emergency Maintenance' : 'Scheduled Maintenance',
        subtitle: 'Platform services will be temporarily unavailable',
        badge: data.maintenanceType === 'emergency' ? 'Urgent Notice' : 'Planned Maintenance',
        theme: data.maintenanceType === 'emergency' ? 'orange' : 'dark',
      }),
      body:
        greeting(data.firstName) +
        para(`${PLATFORM.name} will be undergoing <strong>${data.maintenanceType} maintenance</strong>. During this window, some services may be temporarily unavailable.`) +
        infoCard({
          title: 'Maintenance Details',
          rows: [
            { label: 'Date &amp; Time', value: data.maintenanceWindow, highlight: true },
            { label: 'Estimated Duration', value: data.duration },
            { label: 'Type', value: data.maintenanceType === 'emergency' ? 'Emergency — Unplanned' : 'Scheduled — Planned' },
          ],
        }) +
        sectionHeading('Services affected:') +
        checkList(data.affectedServices, '#d97706') +
        alertBox({ type: 'info', title: 'What to do', body: 'Save any open work before the maintenance window begins. All data is preserved automatically. Normal operations will resume once maintenance is complete.' }) +
        para('We apologize for any inconvenience. Our team works hard to minimize downtime.', { muted: true, small: true }),
    }),
  }),
};
