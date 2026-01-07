/**
 * Advanced Returns Management Settings & Configuration
 * Flexible, user-configurable return policies and automation rules
 */

export type ReturnChannel = 'CUSTOMER' | '3PL_CLIENT' | 'RETAIL' | 'MARKETPLACE' | 'INTERNAL' | 'B2B';
export type ReturnLabelType = 'PREPAID' | 'CUSTOMER_PAID' | 'CARRIER_COLLECT' | 'NONE';
export type DispositionAction = 'RESTOCK_A' | 'RESTOCK_B' | 'RESTOCK_C' | 'REFURBISH' | 'RESALE' | 'RTV' | 'SCRAP' | 'DONATE' | 'QUARANTINE';
export type CreditMethod = 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'CHECK' | 'GIFT_CARD' | 'ACH' | 'MANUAL';

export interface ReturnSettings {
  organizationId: string;
  
  // General Settings
  general: {
    enabled: boolean;
    requireRMA: boolean;
    autoNumberFormat: string; // e.g., "RMA-{YYYY}{MM}{DD}-{###}"
    defaultReturnWindow: number; // days
    allowLateReturns: boolean;
    lateReturnApprovalRequired: boolean;
  };

  // Label Settings
  labels: {
    enabled: boolean;
    defaultType: ReturnLabelType;
    autoGenerate: boolean;
    carriers: {
      name: string; // 'UPS', 'FedEx', 'USPS', 'DHL'
      enabled: boolean;
      accountNumber?: string;
      serviceLevel?: string;
      prepaidByDefault: boolean;
    }[];
    includeQRCode: boolean;
    includeInstructions: boolean;
    customInstructions?: string;
  };

  // Eligibility Rules
  eligibility: {
    requireOriginalPackaging: boolean;
    requirePhotosForDamage: boolean;
    requireSerialForWarranty: boolean;
    
    // Automatic approvals
    autoApprove: {
      enabled: boolean;
      maxValue: number; // auto-approve returns under this value
      withinDays: number; // only auto-approve if within X days
      excludedCategories: string[];
      excludedSKUs: string[];
      requiresPhotos: boolean;
    };

    // Restrictions
    restrictions: {
      hazmatBlocked: boolean;
      perishableBlocked: boolean;
      customBlocked: boolean;
      highValueRequiresApproval: boolean;
      highValueThreshold: number;
    };
  };

  // Financial Settings
  financial: {
    // Refunds
    refunds: {
      enabled: boolean;
      methods: CreditMethod[];
      defaultMethod: CreditMethod;
      autoIssue: boolean;
      autoIssueThreshold: number;
      
      // Fees
      restockingFee: {
        enabled: boolean;
        type: 'PERCENTAGE' | 'FLAT';
        value: number;
        applyToDefective: boolean;
        applyToUnwanted: boolean;
      };

      deductShipping: boolean;
      deductOriginalShipping: boolean;
    };

    // Replacements
    replacements: {
      enabled: boolean;
      autoShip: boolean;
      expediteShipping: boolean;
      chargeShipping: boolean;
    };

    // Store Credit
    storeCredit: {
      enabled: boolean;
      bonusPercentage: number; // e.g., 10 = give 110% back as store credit
      expirationDays: number;
    };
  };

  // Inspection & Triage
  inspection: {
    required: boolean;
    requirePhotos: boolean;
    minPhotosRequired: number;
    
    // Computer Vision
    computerVision: {
      enabled: boolean;
      autoGrade: boolean;
      damageDetection: boolean;
      authenticityCheck: boolean;
      confidenceThreshold: number; // 0-100
    };

    // Condition Grading
    grading: {
      enabled: boolean;
      grades: {
        code: string; // 'A', 'B', 'C', 'D', 'F'
        label: string; // 'Like New', 'Good', 'Fair', 'Poor', 'Scrap'
        restockable: boolean;
        refundPercentage: number; // % of original price
        resaleMultiplier: number; // pricing multiplier for resale
      }[];
    };

    // QC Requirements
    qc: {
      requiresQC: boolean;
      randomSampling: boolean;
      samplingRate: number; // 0-100%
      highValueAlways: boolean;
      defectiveAlways: boolean;
    };
  };

  // Disposition Rules
  disposition: {
    autoDisposition: boolean;
    
    rules: {
      condition: string; // 'GRADE_A', 'GRADE_B', 'DEFECTIVE', etc.
      reasonCategory: string; // 'UNWANTED', 'DAMAGED', 'DEFECTIVE'
      action: DispositionAction;
      autoExecute: boolean;
    }[];

    // Restocking
    restocking: {
      enabled: boolean;
      autoRestock: boolean;
      updateAvailableQty: boolean;
      requireLocationScan: boolean;
      defaultLocation?: string;
    };

    // Refurbishment
    refurbishment: {
      enabled: boolean;
      autoCreateWorkOrders: boolean;
      priorityThreshold: number; // value threshold for high priority
      trackCosts: boolean;
    };

    // Resale/Secondary Market
    resale: {
      enabled: boolean;
      autoList: boolean;
      channels: {
        name: string; // 'Amazon', 'eBay', 'Shopify'
        enabled: boolean;
        minGrade: string; // minimum grade to list on this channel
        autoPrice: boolean;
        priceFloor: number; // minimum % of original price
      }[];
    };

    // Return to Vendor (RTV)
    rtv: {
      enabled: boolean;
      autoCreate: boolean;
      defectiveThreshold: number; // % of returns that trigger RTV
      requireVendorAuth: boolean;
      trackClaims: boolean;
    };

    // Scrap/Donate
    scrap: {
      enabled: boolean;
      requireApproval: boolean;
      documentDisposal: boolean;
      environmentalCompliance: boolean;
    };

    donate: {
      enabled: boolean;
      partners: string[];
      taxDocumentation: boolean;
    };
  };

  // Fraud Prevention
  fraud: {
    enabled: boolean;
    
    // Detection Rules
    detection: {
      serialValidation: boolean;
      duplicateDetection: boolean;
      customerRateLimit: {
        enabled: boolean;
        maxReturns: number;
        periodDays: number;
        action: 'FLAG' | 'BLOCK' | 'REVIEW';
      };
      
      highRiskPatterns: {
        enabled: boolean;
        patterns: string[]; // e.g., 'SERIAL_RETURNER', 'WRONG_SERIAL', 'HIGH_VALUE_FREQUENT'
        action: 'FLAG' | 'HOLD' | 'REVIEW' | 'REJECT';
      };

      mlScoring: {
        enabled: boolean;
        scoreThreshold: number; // 0-100, flag if above
        autoReject: boolean;
        autoRejectThreshold: number;
      };
    };

    // Response Actions
    responses: {
      flagForReview: boolean;
      holdInventory: boolean;
      notifyManager: boolean;
      requireManagerApproval: boolean;
      documentEvidence: boolean;
    };
  };

  // Customer Experience
  customerExperience: {
    selfService: {
      enabled: boolean;
      portalUrl?: string;
      allowInitiation: boolean;
      allowTracking: boolean;
      allowPhotoUpload: boolean;
      showReturnLabel: boolean;
      showEstimatedCredit: boolean;
    };

    notifications: {
      enabled: boolean;
      channels: ('EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK')[];
      
      events: {
        rmaCreated: boolean;
        rmaApproved: boolean;
        rmaRejected: boolean;
        labelGenerated: boolean;
        returnReceived: boolean;
        creditIssued: boolean;
        replacementShipped: boolean;
      };

      templates: {
        event: string;
        subject?: string;
        body: string;
      }[];
    };

    support: {
      chatEnabled: boolean;
      aiAssistant: boolean;
      phoneSupport: boolean;
      phoneNumber?: string;
      businessHours?: string;
    };
  };

  // Analytics & Reporting
  analytics: {
    enabled: boolean;
    
    // Forecasting
    forecasting: {
      enabled: boolean;
      horizonDays: number;
      modelRetrain: number; // days between retraining
    };

    // Alerts
    alerts: {
      enabled: boolean;
      thresholds: {
        returnRateIncrease: number; // %
        defectRateIncrease: number; // %
        fraudScoreIncrease: number; // %
        processingTimeIncrease: number; // %
      };
      recipients: string[];
    };

    // Dashboards
    dashboards: {
      realTime: boolean;
      customMetrics: {
        name: string;
        formula: string;
        target: number;
      }[];
    };
  };

  // Integration Settings
  integrations: {
    // Shipping
    shipping: {
      provider: string; // 'ShipStation', 'EasyPost', 'ShipEngine', 'Custom'
      apiKey?: string;
      webhookUrl?: string;
      autoTrack: boolean;
    };

    // Accounting
    accounting: {
      provider?: string; // 'QuickBooks', 'Xero', 'NetSuite', 'SAP'
      autoSyncCredits: boolean;
      autoSyncCosts: boolean;
      accountingCodes: {
        returns: string;
        restocking: string;
        refunds: string;
        scrap: string;
      };
    };

    // Customer Service
    customerService: {
      provider?: string; // 'Zendesk', 'Freshdesk', 'Intercom'
      autoCreateTicket: boolean;
      autoUpdateTicket: boolean;
      linkRMAToTicket: boolean;
    };

    // Marketplace
    marketplace: {
      amazon: {
        enabled: boolean;
        autoProcessReturns: boolean;
        syncLabels: boolean;
      };
      shopify: {
        enabled: boolean;
        autoProcessReturns: boolean;
        syncInventory: boolean;
      };
      ebay: {
        enabled: boolean;
        autoProcessReturns: boolean;
        syncListings: boolean;
      };
    };
  };

  // Voice & Mobile
  voice: {
    enabled: boolean;
    commands: {
      receiving: boolean;
      inspection: boolean;
      disposition: boolean;
      approval: boolean;
    };
    tts: boolean; // text-to-speech feedback
    multiLanguage: boolean;
    languages: string[];
  };

  mobile: {
    enabled: boolean;
    features: {
      scanning: boolean;
      photos: boolean;
      signature: boolean;
      offlineMode: boolean;
      gpTracking: boolean;
    };
  };

  // Compliance
  compliance: {
    gdpr: {
      enabled: boolean;
      dataRetention: number; // days
      rightToForget: boolean;
    };
    
    environmental: {
      trackDisposal: boolean;
      ewasteCompliance: boolean;
      documentChain: boolean;
    };

    recall: {
      autoQuarantine: boolean;
      notifyCustomers: boolean;
      trackBatches: boolean;
    };

    audit: {
      enabled: boolean;
      logAllActions: boolean;
      photoEvidence: boolean;
      digitalSignatures: boolean;
      retentionDays: number;
    };
  };

  // Performance & SLAs
  sla: {
    approval: {
      hours: number;
      businessHoursOnly: boolean;
    };
    
    inspection: {
      hours: number;
      businessHoursOnly: boolean;
    };

    creditIssuance: {
      days: number;
      businessDaysOnly: boolean;
    };

    replacement: {
      days: number;
      expediteForDefective: boolean;
    };

    alerts: {
      enabled: boolean;
      notifyOnBreach: boolean;
      escalate: boolean;
    };
  };

  // Custom Fields
  customFields: {
    name: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
    required: boolean;
    options?: string[];
    appliesTo: 'RMA' | 'LINE' | 'BOTH';
  }[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Default return settings template
 */
export const DEFAULT_RETURN_SETTINGS: Partial<ReturnSettings> = {
  general: {
    enabled: true,
    requireRMA: true,
    autoNumberFormat: 'RMA-{YYYY}{MM}{DD}-{###}',
    defaultReturnWindow: 30,
    allowLateReturns: true,
    lateReturnApprovalRequired: true,
  },

  labels: {
    enabled: true,
    defaultType: 'PREPAID',
    autoGenerate: true,
    carriers: [
      { name: 'UPS', enabled: true, prepaidByDefault: true },
      { name: 'FedEx', enabled: true, prepaidByDefault: true },
      { name: 'USPS', enabled: true, prepaidByDefault: false },
    ],
    includeQRCode: true,
    includeInstructions: true,
  },

  eligibility: {
    requireOriginalPackaging: false,
    requirePhotosForDamage: true,
    requireSerialForWarranty: true,
    
    autoApprove: {
      enabled: true,
      maxValue: 100,
      withinDays: 30,
      excludedCategories: [],
      excludedSKUs: [],
      requiresPhotos: false,
    },

    restrictions: {
      hazmatBlocked: true,
      perishableBlocked: true,
      customBlocked: false,
      highValueRequiresApproval: true,
      highValueThreshold: 500,
    },
  },

  financial: {
    refunds: {
      enabled: true,
      methods: ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'CHECK'],
      defaultMethod: 'ORIGINAL_PAYMENT',
      autoIssue: true,
      autoIssueThreshold: 100,
      
      restockingFee: {
        enabled: false,
        type: 'PERCENTAGE',
        value: 15,
        applyToDefective: false,
        applyToUnwanted: true,
      },

      deductShipping: false,
      deductOriginalShipping: false,
    },

    replacements: {
      enabled: true,
      autoShip: true,
      expediteShipping: true,
      chargeShipping: false,
    },

    storeCredit: {
      enabled: true,
      bonusPercentage: 10,
      expirationDays: 365,
    },
  },

  inspection: {
    required: true,
    requirePhotos: true,
    minPhotosRequired: 2,
    
    computerVision: {
      enabled: true,
      autoGrade: true,
      damageDetection: true,
      authenticityCheck: false,
      confidenceThreshold: 80,
    },

    grading: {
      enabled: true,
      grades: [
        { code: 'A', label: 'Like New', restockable: true, refundPercentage: 100, resaleMultiplier: 0.9 },
        { code: 'B', label: 'Good', restockable: true, refundPercentage: 85, resaleMultiplier: 0.7 },
        { code: 'C', label: 'Fair', restockable: false, refundPercentage: 60, resaleMultiplier: 0.5 },
        { code: 'D', label: 'Poor', restockable: false, refundPercentage: 40, resaleMultiplier: 0.3 },
        { code: 'F', label: 'Scrap', restockable: false, refundPercentage: 0, resaleMultiplier: 0 },
      ],
    },

    qc: {
      requiresQC: true,
      randomSampling: true,
      samplingRate: 20,
      highValueAlways: true,
      defectiveAlways: true,
    },
  },

  disposition: {
    autoDisposition: true,
    
    rules: [
      { condition: 'GRADE_A', reasonCategory: 'UNWANTED', action: 'RESTOCK_A', autoExecute: true },
      { condition: 'GRADE_B', reasonCategory: 'UNWANTED', action: 'RESTOCK_B', autoExecute: true },
      { condition: 'GRADE_A', reasonCategory: 'DEFECTIVE', action: 'RTV', autoExecute: false },
      { condition: 'GRADE_B', reasonCategory: 'DAMAGED', action: 'REFURBISH', autoExecute: true },
      { condition: 'GRADE_C', reasonCategory: 'ANY', action: 'RESALE', autoExecute: true },
      { condition: 'GRADE_D', reasonCategory: 'ANY', action: 'SCRAP', autoExecute: false },
    ],

    restocking: {
      enabled: true,
      autoRestock: true,
      updateAvailableQty: true,
      requireLocationScan: true,
    },

    refurbishment: {
      enabled: true,
      autoCreateWorkOrders: true,
      priorityThreshold: 200,
      trackCosts: true,
    },

    resale: {
      enabled: true,
      autoList: false,
      channels: [
        { name: 'Amazon', enabled: true, minGrade: 'B', autoPrice: true, priceFloor: 0.5 },
        { name: 'eBay', enabled: true, minGrade: 'C', autoPrice: true, priceFloor: 0.3 },
        { name: 'Shopify', enabled: false, minGrade: 'B', autoPrice: false, priceFloor: 0.6 },
      ],
    },

    rtv: {
      enabled: true,
      autoCreate: false,
      defectiveThreshold: 10,
      requireVendorAuth: true,
      trackClaims: true,
    },

    scrap: {
      enabled: true,
      requireApproval: true,
      documentDisposal: true,
      environmentalCompliance: true,
    },

    donate: {
      enabled: false,
      partners: [],
      taxDocumentation: true,
    },
  },

  fraud: {
    enabled: true,
    
    detection: {
      serialValidation: true,
      duplicateDetection: true,
      customerRateLimit: {
        enabled: true,
        maxReturns: 5,
        periodDays: 30,
        action: 'REVIEW',
      },
      
      highRiskPatterns: {
        enabled: true,
        patterns: ['SERIAL_RETURNER', 'WRONG_SERIAL', 'HIGH_VALUE_FREQUENT'],
        action: 'REVIEW',
      },

      mlScoring: {
        enabled: true,
        scoreThreshold: 70,
        autoReject: false,
        autoRejectThreshold: 90,
      },
    },

    responses: {
      flagForReview: true,
      holdInventory: true,
      notifyManager: true,
      requireManagerApproval: true,
      documentEvidence: true,
    },
  },

  customerExperience: {
    selfService: {
      enabled: true,
      allowInitiation: true,
      allowTracking: true,
      allowPhotoUpload: true,
      showReturnLabel: true,
      showEstimatedCredit: true,
    },

    notifications: {
      enabled: true,
      channels: ['EMAIL', 'SMS'],
      
      events: {
        rmaCreated: true,
        rmaApproved: true,
        rmaRejected: true,
        labelGenerated: true,
        returnReceived: true,
        creditIssued: true,
        replacementShipped: true,
      },

      templates: [],
    },

    support: {
      chatEnabled: true,
      aiAssistant: true,
      phoneSupport: true,
    },
  },

  analytics: {
    enabled: true,
    
    forecasting: {
      enabled: true,
      horizonDays: 90,
      modelRetrain: 7,
    },

    alerts: {
      enabled: true,
      thresholds: {
        returnRateIncrease: 20,
        defectRateIncrease: 15,
        fraudScoreIncrease: 25,
        processingTimeIncrease: 30,
      },
      recipients: [],
    },

    dashboards: {
      realTime: true,
      customMetrics: [],
    },
  },

  voice: {
    enabled: true,
    commands: {
      receiving: true,
      inspection: true,
      disposition: true,
      approval: true,
    },
    tts: true,
    multiLanguage: true,
    languages: ['en', 'es', 'fr', 'de', 'zh'],
  },

  mobile: {
    enabled: true,
    features: {
      scanning: true,
      photos: true,
      signature: true,
      offlineMode: true,
      gpsTracking: false,
    },
  },

  compliance: {
    gdpr: {
      enabled: true,
      dataRetention: 2555, // 7 years
      rightToForget: true,
    },
    
    environmental: {
      trackDisposal: true,
      ewasteCompliance: true,
      documentChain: true,
    },

    recall: {
      autoQuarantine: true,
      notifyCustomers: true,
      trackBatches: true,
    },

    audit: {
      enabled: true,
      logAllActions: true,
      photoEvidence: true,
      digitalSignatures: false,
      retentionDays: 2555,
    },
  },

  sla: {
    approval: {
      hours: 24,
      businessHoursOnly: false,
    },
    
    inspection: {
      hours: 48,
      businessHoursOnly: true,
    },

    creditIssuance: {
      days: 5,
      businessDaysOnly: true,
    },

    replacement: {
      days: 3,
      expediteForDefective: true,
    },

    alerts: {
      enabled: true,
      notifyOnBreach: true,
      escalate: true,
    },
  },

  customFields: [],
};
