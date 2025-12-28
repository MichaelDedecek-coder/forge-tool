/**
 * Tier Configuration & Limits
 * DataWizard Pricing Tiers
 */

export const TIER_LIMITS = {
  free: {
    name: 'Free',
    maxRows: 10000,
    analysesPerMonth: 5,
    pdfExport: false,
    pptExport: false,
    reportStorage: false,
    storageDays: 0,
    priorityProcessing: false,
    apiAccess: false,
    price: 0
  },
  pro: {
    name: 'Pro',
    maxRows: 100000,
    analysesPerMonth: Infinity,
    pdfExport: true,
    pptExport: true,
    reportStorage: true,
    storageDays: 30,
    priorityProcessing: true,
    apiAccess: false,
    price: 29 // EUR per month
  },
  enterprise: {
    name: 'Enterprise',
    maxRows: 500000,
    analysesPerMonth: Infinity,
    pdfExport: true,
    pptExport: true,
    reportStorage: true,
    storageDays: 365,
    priorityProcessing: true,
    apiAccess: true,
    whiteLabel: true,
    price: 199 // EUR per month (starting price)
  }
};

/**
 * Check if user can perform analysis based on their tier
 *
 * @param {string} tier - User's tier ('free', 'pro', 'enterprise')
 * @param {number} currentUsage - Current month's analysis count
 * @param {number} fileRowCount - Number of rows in the file to analyze
 * @returns {Object} { allowed: boolean, reason?: string, message?: string, upgrade?: string }
 */
export function checkTierLimits(tier, currentUsage, fileRowCount) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // Check row limit
  if (fileRowCount > limits.maxRows) {
    const upgradeTier = tier === 'free' ? 'pro' : 'enterprise';
    return {
      allowed: false,
      reason: 'row_limit',
      message: `Your ${limits.name} plan supports up to ${limits.maxRows.toLocaleString()} rows. This file has ${fileRowCount.toLocaleString()} rows.`,
      upgrade: upgradeTier,
      upgradeMessage: `Upgrade to ${TIER_LIMITS[upgradeTier].name} for ${TIER_LIMITS[upgradeTier].maxRows.toLocaleString()} rows.`
    };
  }

  // Check monthly analysis limit
  if (currentUsage >= limits.analysesPerMonth) {
    return {
      allowed: false,
      reason: 'analysis_limit',
      message: `You've used ${currentUsage}/${limits.analysesPerMonth} analyses this month.`,
      upgrade: 'pro',
      upgradeMessage: `Upgrade to Pro for unlimited analyses — €${TIER_LIMITS.pro.price}/month.`
    };
  }

  return { allowed: true };
}

/**
 * Check if user can export to PDF/PPT
 */
export function canExport(tier, format) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  if (format === 'pdf') {
    return limits.pdfExport;
  }

  if (format === 'ppt') {
    return limits.pptExport;
  }

  return false;
}

/**
 * Check if user can save reports
 */
export function canSaveReports(tier) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  return limits.reportStorage;
}

/**
 * Get tier display info
 */
export function getTierInfo(tier) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  return {
    name: limits.name,
    badge: tier.toUpperCase(),
    color: {
      free: '#64748b',    // slate
      pro: '#3b82f6',     // blue
      enterprise: '#8b5cf6' // purple
    }[tier] || '#64748b',
    features: {
      rowLimit: limits.maxRows === Infinity
        ? 'Unlimited rows'
        : `Up to ${limits.maxRows.toLocaleString()} rows`,
      analysisLimit: limits.analysesPerMonth === Infinity
        ? 'Unlimited analyses'
        : `${limits.analysesPerMonth} analyses/month`,
      exports: limits.pdfExport && limits.pptExport
        ? 'PDF + PPT export'
        : 'No exports',
      storage: limits.reportStorage
        ? `${limits.storageDays}-day report storage`
        : 'No storage'
    }
  };
}

/**
 * Calculate days until usage resets
 */
export function getDaysUntilReset() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffTime = nextMonth - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
