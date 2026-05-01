/**
 * Scheduling / staffing email templates: shift offers, inbound staffing
 * opportunity notifications surfaced from Trinity. Split from
 * emailService.ts. Larger scheduling templates (assignment, reminder,
 * broadcast, calloff) live in emailCore.ts which is unchanged.
 */
import {
  emailLayout, emailHeader, greeting, para, infoCard, alertBox, ctaButton,
} from '../../emailTemplateBase';

export const schedulingTemplates = {
  inboundOpportunityNotification: (data: {
    managerName: string;
    contractorName: string;
    shiftCount: number;
    shiftDetails: string;
    reviewUrl: string;
  }) => ({
    subject: `New Shift Opportunity: ${data.contractorName || 'New Request'} — ${data.shiftCount || 0} shift(s) detected`,
    html: emailLayout({
      preheader: `Trinity detected a new staffing opportunity from ${data.contractorName || 'a contractor'}. Review and staff now.`,
      header: emailHeader({ title: 'New Shift Opportunity', subtitle: 'Trinity has identified a new staffing request', badge: 'AI Detected', theme: 'orange' }),
      body:
        greeting(data.managerName || 'there') +
        para(`Trinity has automatically detected a new shift request from <strong>${data.contractorName || 'a contractor'}</strong> requiring your attention.`) +
        infoCard({
          title: 'Opportunity Details',
          rows: [
            { label: 'Source', value: data.contractorName || 'Contractor', highlight: true },
            { label: 'Shifts Detected', value: String(data.shiftCount || 0) },
          ],
        }) +
        alertBox({ type: 'warning', title: 'Shift Details', body: `<pre style="margin:0;font-size:13px;white-space:pre-wrap;font-family:inherit;">${data.shiftDetails || 'No details available'}</pre>` }) +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Review &amp; Staff This Shift', url: data.reviewUrl, style: 'warning' }) +
        '</td></tr></table>' +
        para('Trinity is ready to suggest qualified employees for this shift once you open it.', { muted: true, small: true }),
    }),
  }),

  shiftOfferNotification: (data: {
    employeeName: string;
    clientName: string;
    location: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    payRate?: string;
    matchRank: number;
    matchScore: number;
    matchReasons: string[];
    respondUrl: string;
    expiresIn: string;
  }) => ({
    subject: `New Shift Offer: ${data.clientName} on ${data.shiftDate}`,
    html: emailLayout({
      preheader: `You have been selected as a top match for a shift at ${data.clientName} on ${data.shiftDate}.`,
      header: emailHeader({ title: 'New Shift Offer', subtitle: 'You have been selected for this shift', badge: `Match #${data.matchRank}`, theme: 'green' }),
      body:
        greeting(data.employeeName) +
        para('Based on your qualifications and availability, you have been selected as a top match for an upcoming shift.') +
        infoCard({
          title: 'Shift Details',
          rows: [
            { label: 'Client', value: data.clientName, highlight: true },
            { label: 'Location', value: data.location },
            { label: 'Date', value: data.shiftDate },
            { label: 'Time', value: `${data.startTime} — ${data.endTime}` },
            ...(data.payRate ? [{ label: 'Pay Rate', value: `$${data.payRate}/hr`, highlight: true }] : []),
          ],
        }) +
        infoCard({
          title: `Why You Were Selected (Score: ${Math.round(data.matchScore * 100)}%)`,
          rows: data.matchReasons.map(r => ({ label: '&#10003;', value: r })),
        }) +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">' +
        ctaButton({ text: 'Accept This Shift', url: data.respondUrl, style: 'success' }) +
        '</td></tr></table>' +
        alertBox({ type: 'warning', title: `Offer expires in ${data.expiresIn}`, body: 'Please respond as soon as possible. If you cannot make it, click the link above to decline so we can offer it to another officer.' }),
    }),
  }),
};
