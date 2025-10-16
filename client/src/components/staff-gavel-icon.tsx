/**
 * Staff Authority Gavel Icon
 * Tiny gavel icon displayed next to platform staff names
 */

import gavelIcon from "@assets/Fatcow-Farm-Fresh-Auction-hammer-gavel.32_1760601387187.png";

interface StaffGavelIconProps {
  className?: string;
}

export function StaffGavelIcon({ className = "" }: StaffGavelIconProps) {
  return (
    <img
      src={gavelIcon}
      alt="Staff"
      className={`inline-block ${className}`}
      style={{ 
        width: '14px', 
        height: '14px',
        verticalAlign: 'middle',
        marginRight: '4px'
      }}
      data-testid="icon-staff-gavel"
    />
  );
}
