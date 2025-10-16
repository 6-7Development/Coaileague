/**
 * Staff Name Display Component
 * Replaces 🔨 gavel emoji marker with actual gavel icon image
 */

import { StaffGavelIcon } from "./staff-gavel-icon";

interface StaffNameDisplayProps {
  name: string;
  className?: string;
}

export function StaffNameDisplay({ name, className = "" }: StaffNameDisplayProps) {
  // Check if name has staff gavel marker
  const hasGavelMarker = name.includes('🔨');
  
  if (!hasGavelMarker) {
    return <span className={className}>{name}</span>;
  }
  
  // Replace 🔨 with actual gavel icon
  const cleanName = name.replace('🔨 ', '').trim();
  
  return (
    <span className={className}>
      <StaffGavelIcon className="mr-1" />
      {cleanName}
    </span>
  );
}
