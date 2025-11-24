/**
 * File Cabinet Configuration - Universal & Dynamic
 * Configuration for document management, storage, and compliance tracking
 */

export const fileCabinetConfig = {
  // File Cabinet Integration Status
  integration: {
    enabled: process.env.VITE_FILE_CABINET_ENABLED === 'true' || false, // Disabled until implementation complete
    provider: process.env.VITE_FILE_CABINET_PROVIDER || 'local', // 'local', 'google_drive', 's3', 'sharepoint'
    syncEnabled: process.env.VITE_FILE_CABINET_SYNC === 'true' || false,
    syncIntervalMinutes: parseInt(process.env.VITE_FILE_CABINET_SYNC_INTERVAL || '60', 10),
  },

  // Document Classification for Compliance Checking
  documentTypes: {
    // Required certifications/licenses
    certifications: {
      filePattern: /certification|license|credential/i,
      complianceRequired: true,
      expirationTracking: true,
      warningDaysBefore: parseInt(process.env.VITE_DOC_CERT_WARNING_DAYS || '30', 10),
    },
    // Background checks and screening
    backgroundChecks: {
      filePattern: /background|screening|check/i,
      complianceRequired: true,
      expirationTracking: true,
      warningDaysBefore: parseInt(process.env.VITE_DOC_BG_WARNING_DAYS || '365', 10),
    },
    // Training and compliance records
    trainingRecords: {
      filePattern: /training|onboarding|orientation/i,
      complianceRequired: true,
      expirationTracking: false,
    },
    // Insurance and liability documents
    insurance: {
      filePattern: /insurance|liability|coverage/i,
      complianceRequired: false,
      expirationTracking: true,
      warningDaysBefore: parseInt(process.env.VITE_DOC_INS_WARNING_DAYS || '60', 10),
    },
    // Contracts and agreements
    contracts: {
      filePattern: /contract|agreement|policy/i,
      complianceRequired: false,
      expirationTracking: false,
    },
  },

  // Storage Settings
  storage: {
    maxFileSize: parseInt(process.env.VITE_FILE_CABINET_MAX_SIZE || '52428800', 10), // 50MB default
    allowedMimeTypes: process.env.VITE_FILE_CABINET_MIME_TYPES?.split(',') || [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    storageLocation: process.env.VITE_FILE_CABINET_STORAGE || 'object-storage', // 'object-storage', 'database'
  },

  // Access Control
  accessControl: {
    requireApprovalForAccess: process.env.VITE_FILE_CABINET_APPROVAL_REQUIRED === 'true' || false,
    enableDownloadTracking: process.env.VITE_FILE_CABINET_TRACK_DOWNLOADS === 'true' || true,
    enableModificationTracking: process.env.VITE_FILE_CABINET_TRACK_MODS === 'true' || true,
    auditLogRetentionDays: parseInt(process.env.VITE_FILE_CABINET_AUDIT_DAYS || '2555', 10),
  },

  // Sharing & Collaboration
  sharing: {
    enableExternalSharing: process.env.VITE_FILE_CABINET_EXTERNAL_SHARE === 'true' || false,
    requireExpirationOnSharedLinks: process.env.VITE_FILE_CABINET_SHARE_EXPIRE === 'true' || true,
    defaultShareExpireDays: parseInt(process.env.VITE_FILE_CABINET_SHARE_DAYS || '7', 10),
    enablePasswordProtection: process.env.VITE_FILE_CABINET_PASSWORD_PROTECT === 'true' || false,
  },

  // Compliance Features (Currently Disabled - Integration Pending)
  complianceChecking: {
    enabled: process.env.VITE_FILE_CABINET_COMPLIANCE_CHECK === 'true' || false,
    autoFlagExpiring: process.env.VITE_FILE_CABINET_AUTO_FLAG === 'true' || true,
    autoFlagExpired: process.env.VITE_FILE_CABINET_AUTO_FLAG_EXPIRED === 'true' || true,
    createTicketsForMissing: process.env.VITE_FILE_CABINET_CREATE_TICKETS === 'true' || false,
  },

  // Features (Stubs - Ready for Implementation)
  features: {
    // Document version control - Not yet implemented
    versionControl: {
      enabled: false,
      maxVersions: 10,
    },
    // Document search and indexing - Not yet implemented
    search: {
      enabled: false,
      fullTextSearch: false,
    },
    // Automated document extraction - Not yet implemented
    extraction: {
      enabled: false,
      ocrEnabled: false,
    },
  },
};

export default fileCabinetConfig;
