/**
 * Gamification Event Types — CoAIleague Workforce Gamification
 * Domain: Workforce / Engagement
 * Real implementation using employee_points and employee_achievements tables
 */

export const GAMIFICATION_EVENTS = {
  CLOCK_IN:            { id: 'clock_in',            points: 10, label: 'Clocked In On Time' },
  CLOCK_OUT:           { id: 'clock_out',            points: 5,  label: 'Shift Completed' },
  SHIFT_ACCEPTED:      { id: 'shift_accepted',       points: 15, label: 'Shift Accepted' },
  SHIFT_COMPLETED:     { id: 'shift_completed',      points: 25, label: 'Shift Completed with No Issues' },
  CALLOFF_COVERED:     { id: 'calloff_covered',      points: 50, label: 'Emergency Coverage Hero' },
  PERFECT_ATTENDANCE:  { id: 'perfect_attendance',   points: 100, label: 'Perfect Attendance Week' },
  TRAINING_COMPLETE:   { id: 'training_complete',    points: 30, label: 'Training Completed' },
  CERT_RENEWED:        { id: 'cert_renewed',         points: 40, label: 'License/Cert Renewed' },
  STREAK_7:            { id: 'streak_7',             points: 75, label: '7-Day Shift Streak' },
  STREAK_30:           { id: 'streak_30',            points: 200, label: '30-Day Shift Streak' },
  PEER_COMMEND:        { id: 'peer_commend',         points: 20, label: 'Peer Commendation' },
  INCIDENT_FREE_MONTH: { id: 'incident_free_month',  points: 50, label: 'Incident-Free Month' },
} as const;

export type GamificationEventId = keyof typeof GAMIFICATION_EVENTS;

export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0,    label: 'Rookie',       color: '#6B7280' },
  { level: 2, minPoints: 100,  label: 'Professional', color: '#3B82F6' },
  { level: 3, minPoints: 300,  label: 'Expert',       color: '#8B5CF6' },
  { level: 4, minPoints: 600,  label: 'Elite',        color: '#F59E0B' },
  { level: 5, minPoints: 1000, label: 'Legend',       color: '#EF4444' },
] as const;

export function levelFromPoints(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) return LEVEL_THRESHOLDS[i].level;
  }
  return 1;
}
