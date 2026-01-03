// Security Configuration Types for Different Operational Models

export interface VisitorPolicyConfig {
  // Registration Requirements
  preRegistrationRequired: boolean; // TRUE for enterprise, FALSE for SMB
  preRegistrationApprovalRequired: boolean; // TRUE for high-security, FALSE for casual
  walkInsAllowed: boolean; // FALSE for enterprise, TRUE for SMB
  
  // Identification Requirements
  photoIdRequired: boolean; // TRUE for enterprise, FALSE for casual
  photoCapture: boolean; // TRUE for high-security
  backgroundCheckRequired: boolean; // TRUE for sensitive facilities
  
  // Badge Requirements
  physicalBadgeRequired: boolean; // TRUE for enterprise, FALSE for digital-only
  digitalBadgeAllowed: boolean; // TRUE for modern operations
  badgeReturnRequired: boolean; // TRUE for physical badges
  
  // Access Control
  escortRequired: boolean; // TRUE for restricted areas
  allowedAreasEnforced: boolean; // TRUE for zoned facilities
  timeRestrictions: boolean; // TRUE for business hours only
  
  // Host Requirements
  hostRequired: boolean; // TRUE for enterprise, FALSE for public areas
  hostApprovalRequired: boolean; // TRUE for high-security
  hostMustEscort: boolean; // TRUE for maximum security
  
  // Duration & Limits
  maximumVisitDuration: number | null; // Hours, or null for unlimited
  overdueAlertThreshold: number | null; // Hours before alert
  dailyVisitorLimit: number | null; // Max visitors per day, or null
  
  // Compliance & Documentation
  purposeRequired: boolean; // TRUE for audit trails
  companyRequired: boolean; // TRUE for B2B facilities
  emergencyContactRequired: boolean; // TRUE for high-risk areas
  ndaRequired: boolean; // TRUE for confidential areas
  safetyBriefingRequired: boolean; // TRUE for manufacturing
  
  // Regional Compliance (GDPR, etc.)
  dataRetentionDays: number; // 30, 90, 365, etc.
  consentRequired: boolean; // TRUE for GDPR compliance
  rightToErasure: boolean; // TRUE for GDPR
  
  // Notification Settings
  notifyHostOnArrival: boolean;
  notifySecurityOnEntry: boolean;
  sendVisitorConfirmation: boolean;
}

export interface GateControlConfig {
  // Gate Operations
  automatedGates: boolean; // LPR, RFID, etc.
  manualCheckIn: boolean;
  appointmentRequired: boolean;
  
  // Vehicle Inspection
  vehicleInspectionRequired: boolean;
  sealVerificationRequired: boolean;
  weightCheckRequired: boolean;
  
  // After Hours
  afterHoursAccessAllowed: boolean;
  afterHoursApprovalRequired: boolean;
}

export interface SecurityComplianceConfig {
  // Report Frequency
  dailyReportsEnabled: boolean;
  weeklyReportsEnabled: boolean;
  monthlyReportsEnabled: boolean;
  
  // Alert Thresholds
  alertOnOverdueVisitors: boolean;
  alertOnAfterHoursAccess: boolean;
  alertOnFailedAccess: boolean;
  
  // Compliance Standards
  oshaCompliance: boolean;
  isoCompliance: boolean;
  gdprCompliance: boolean;
}

// Pre-built configurations for common scenarios

export const SECURITY_PRESETS = {
  // 🏢 Enterprise / High Security
  ENTERPRISE: {
    visitorPolicy: {
      preRegistrationRequired: true,
      preRegistrationApprovalRequired: true,
      walkInsAllowed: false,
      photoIdRequired: true,
      photoCapture: true,
      backgroundCheckRequired: true,
      physicalBadgeRequired: true,
      digitalBadgeAllowed: false,
      badgeReturnRequired: true,
      escortRequired: true,
      allowedAreasEnforced: true,
      timeRestrictions: true,
      hostRequired: true,
      hostApprovalRequired: true,
      hostMustEscort: true,
      maximumVisitDuration: 8,
      overdueAlertThreshold: 4,
      dailyVisitorLimit: null,
      purposeRequired: true,
      companyRequired: true,
      emergencyContactRequired: true,
      ndaRequired: true,
      safetyBriefingRequired: true,
      dataRetentionDays: 365,
      consentRequired: true,
      rightToErasure: true,
      notifyHostOnArrival: true,
      notifySecurityOnEntry: true,
      sendVisitorConfirmation: true,
    },
    gateControl: {
      automatedGates: true,
      manualCheckIn: false,
      appointmentRequired: true,
      vehicleInspectionRequired: true,
      sealVerificationRequired: true,
      weightCheckRequired: true,
      afterHoursAccessAllowed: false,
      afterHoursApprovalRequired: true,
    },
    compliance: {
      dailyReportsEnabled: true,
      weeklyReportsEnabled: true,
      monthlyReportsEnabled: true,
      alertOnOverdueVisitors: true,
      alertOnAfterHoursAccess: true,
      alertOnFailedAccess: true,
      oshaCompliance: true,
      isoCompliance: true,
      gdprCompliance: true,
    },
  },

  // 🏪 SMB / Casual Security
  SMB_CASUAL: {
    visitorPolicy: {
      preRegistrationRequired: false,
      preRegistrationApprovalRequired: false,
      walkInsAllowed: true,
      photoIdRequired: false,
      photoCapture: false,
      backgroundCheckRequired: false,
      physicalBadgeRequired: false,
      digitalBadgeAllowed: true,
      badgeReturnRequired: false,
      escortRequired: false,
      allowedAreasEnforced: false,
      timeRestrictions: false,
      hostRequired: false,
      hostApprovalRequired: false,
      hostMustEscort: false,
      maximumVisitDuration: null,
      overdueAlertThreshold: null,
      dailyVisitorLimit: null,
      purposeRequired: true,
      companyRequired: false,
      emergencyContactRequired: false,
      ndaRequired: false,
      safetyBriefingRequired: false,
      dataRetentionDays: 90,
      consentRequired: false,
      rightToErasure: false,
      notifyHostOnArrival: false,
      notifySecurityOnEntry: false,
      sendVisitorConfirmation: true,
    },
    gateControl: {
      automatedGates: false,
      manualCheckIn: true,
      appointmentRequired: false,
      vehicleInspectionRequired: false,
      sealVerificationRequired: false,
      weightCheckRequired: false,
      afterHoursAccessAllowed: false,
      afterHoursApprovalRequired: false,
    },
    compliance: {
      dailyReportsEnabled: false,
      weeklyReportsEnabled: true,
      monthlyReportsEnabled: false,
      alertOnOverdueVisitors: false,
      alertOnAfterHoursAccess: false,
      alertOnFailedAccess: false,
      oshaCompliance: false,
      isoCompliance: false,
      gdprCompliance: false,
    },
  },

  // 🏭 Manufacturing / Safety-Critical
  MANUFACTURING: {
    visitorPolicy: {
      preRegistrationRequired: true,
      preRegistrationApprovalRequired: true,
      walkInsAllowed: false,
      photoIdRequired: true,
      photoCapture: true,
      backgroundCheckRequired: false,
      physicalBadgeRequired: true,
      digitalBadgeAllowed: false,
      badgeReturnRequired: true,
      escortRequired: true,
      allowedAreasEnforced: true,
      timeRestrictions: true,
      hostRequired: true,
      hostApprovalRequired: true,
      hostMustEscort: true,
      maximumVisitDuration: 8,
      overdueAlertThreshold: 6,
      dailyVisitorLimit: 50,
      purposeRequired: true,
      companyRequired: true,
      emergencyContactRequired: true,
      ndaRequired: false,
      safetyBriefingRequired: true, // ⚠️ CRITICAL
      dataRetentionDays: 365,
      consentRequired: true,
      rightToErasure: false,
      notifyHostOnArrival: true,
      notifySecurityOnEntry: true,
      sendVisitorConfirmation: true,
    },
    gateControl: {
      automatedGates: false,
      manualCheckIn: true,
      appointmentRequired: true,
      vehicleInspectionRequired: true,
      sealVerificationRequired: false,
      weightCheckRequired: false,
      afterHoursAccessAllowed: false,
      afterHoursApprovalRequired: true,
    },
    compliance: {
      dailyReportsEnabled: true,
      weeklyReportsEnabled: true,
      monthlyReportsEnabled: true,
      alertOnOverdueVisitors: true,
      alertOnAfterHoursAccess: true,
      alertOnFailedAccess: true,
      oshaCompliance: true, // ⚠️ REQUIRED
      isoCompliance: true,
      gdprCompliance: true,
    },
  },

  // 📦 3PL / Multi-Tenant
  THREE_PL: {
    visitorPolicy: {
      preRegistrationRequired: true,
      preRegistrationApprovalRequired: false, // Fast turnaround for clients
      walkInsAllowed: true,
      photoIdRequired: true,
      photoCapture: false,
      backgroundCheckRequired: false,
      physicalBadgeRequired: false,
      digitalBadgeAllowed: true,
      badgeReturnRequired: false,
      escortRequired: false,
      allowedAreasEnforced: true, // Client-specific zones
      timeRestrictions: false,
      hostRequired: false,
      hostApprovalRequired: false,
      hostMustEscort: false,
      maximumVisitDuration: null,
      overdueAlertThreshold: 8,
      dailyVisitorLimit: null,
      purposeRequired: true,
      companyRequired: true, // Which client?
      emergencyContactRequired: false,
      ndaRequired: false,
      safetyBriefingRequired: false,
      dataRetentionDays: 180,
      consentRequired: true,
      rightToErasure: true,
      notifyHostOnArrival: false,
      notifySecurityOnEntry: false,
      sendVisitorConfirmation: true,
    },
    gateControl: {
      automatedGates: true,
      manualCheckIn: true,
      appointmentRequired: false,
      vehicleInspectionRequired: true,
      sealVerificationRequired: true,
      weightCheckRequired: true,
      afterHoursAccessAllowed: true, // 24/7 operations
      afterHoursApprovalRequired: false,
    },
    compliance: {
      dailyReportsEnabled: true,
      weeklyReportsEnabled: true,
      monthlyReportsEnabled: true,
      alertOnOverdueVisitors: false,
      alertOnAfterHoursAccess: false,
      alertOnFailedAccess: true,
      oshaCompliance: true,
      isoCompliance: false,
      gdprCompliance: true,
    },
  },

  // 🌍 EU / GDPR Strict
  EU_GDPR: {
    visitorPolicy: {
      preRegistrationRequired: true,
      preRegistrationApprovalRequired: true,
      walkInsAllowed: false,
      photoIdRequired: true,
      photoCapture: false, // Biometric data requires explicit consent
      backgroundCheckRequired: false,
      physicalBadgeRequired: true,
      digitalBadgeAllowed: true,
      badgeReturnRequired: true,
      escortRequired: false,
      allowedAreasEnforced: true,
      timeRestrictions: true,
      hostRequired: true,
      hostApprovalRequired: true,
      hostMustEscort: false,
      maximumVisitDuration: 8,
      overdueAlertThreshold: 6,
      dailyVisitorLimit: null,
      purposeRequired: true,
      companyRequired: true,
      emergencyContactRequired: false,
      ndaRequired: false,
      safetyBriefingRequired: false,
      dataRetentionDays: 30, // ⚠️ GDPR minimum
      consentRequired: true, // ⚠️ REQUIRED
      rightToErasure: true, // ⚠️ REQUIRED
      notifyHostOnArrival: true,
      notifySecurityOnEntry: false,
      sendVisitorConfirmation: true,
    },
    gateControl: {
      automatedGates: true,
      manualCheckIn: true,
      appointmentRequired: true,
      vehicleInspectionRequired: false,
      sealVerificationRequired: false,
      weightCheckRequired: false,
      afterHoursAccessAllowed: false,
      afterHoursApprovalRequired: true,
    },
    compliance: {
      dailyReportsEnabled: false,
      weeklyReportsEnabled: true,
      monthlyReportsEnabled: true,
      alertOnOverdueVisitors: true,
      alertOnAfterHoursAccess: true,
      alertOnFailedAccess: true,
      oshaCompliance: false,
      isoCompliance: true,
      gdprCompliance: true, // ⚠️ ENFORCED
    },
  },
};
