/**
 * Staff Authority Icon
 * Tiny WorkforceOS logo displayed next to platform staff names in chat
 */

import { WorkforceOSLogo } from "./workforceos-logo";

interface StaffGavelIconProps {
  className?: string;
}

export function StaffGavelIcon({ className = "" }: StaffGavelIconProps) {
  return (
    <div className={`inline-block ${className}`} style={{ verticalAlign: 'middle', marginRight: '4px' }} data-testid="icon-staff-logo">
      <WorkforceOSLogo size="sm" showText={false} />
    </div>
  );
}
