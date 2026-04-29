import { type ReactNode } from 'react';

// SimpleMode infrastructure — mode switching permanently retired.
// HideInSimpleMode/ShowInSimpleMode are kept as pass-throughs for
// import compatibility. Simple mode is always OFF — all content shows.

interface SimpleModeProps {
  children: ReactNode;
  simple?: ReactNode;
}

export function SimpleMode({ children }: SimpleModeProps) {
  return <>{children}</>;
}

export function HideInSimpleMode({ children }: { children: ReactNode }) {
  // Simple mode is retired — always show content
  return <>{children}</>;
}

export function ShowInSimpleMode({ _children }: { _children: ReactNode }) {
  // Simple mode is retired — ShowInSimpleMode renders nothing (it was "only in simple mode")
  return null;
}
