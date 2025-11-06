import { AutoForceAFLogo } from "./autoforce-af-logo";

// Re-export with old name for backward compatibility
export function AnimatedAutoForceLogo(props: Parameters<typeof AutoForceAFLogo>[0]) {
  return <AutoForceAFLogo {...props} />;
}
