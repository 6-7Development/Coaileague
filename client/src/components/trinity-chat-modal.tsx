/**
 * DEPRECATED — Trinity now lives in ChatDock.
 * All Trinity interactions happen via @Trinity mention in ChatDock
 * or via the #trinity-command channel (managers/owners only).
 * Stub kept to prevent import errors during migration.
 * @deprecated
 */

export function TrinityModalProvider() { return null; }
export const useTrinityModal = () => ({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} });

export default function TrinityChat() { return null; }
