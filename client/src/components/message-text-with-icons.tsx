/**
 * Message Text with Icons
 * Replaces staff gavel emoji marker (🔨) with actual gavel icon in any text
 */

import { StaffGavelIcon } from "./staff-gavel-icon";

interface MessageTextWithIconsProps {
  text: string;
  className?: string;
}

export function MessageTextWithIcons({ text, className = "" }: MessageTextWithIconsProps) {
  // Check if text has staff gavel marker
  const hasGavelMarker = text.includes('🔨');
  
  if (!hasGavelMarker) {
    return <span className={className}>{text}</span>;
  }
  
  // Split text by gavel marker and render with actual icon
  const parts = text.split('🔨');
  
  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && <StaffGavelIcon className="mr-1" />}
          {part}
        </span>
      ))}
    </span>
  );
}
