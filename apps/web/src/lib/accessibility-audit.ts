/**
 * Accessibility Audit Helper
 *
 * Development tool to audit and report accessibility issues
 * in the LogiVox application. WCAG 2.1 AA compliance checks.
 *
 * ⚠️ This is a development tool - do not include in production builds
 */

export interface AccessibilityIssue {
  severity: "error" | "warning" | "info";
  element: string;
  issue: string;
  recommendation: string;
  wcagCriterion?: string;
}

export interface AccessibilityAuditResult {
  totalIssues: number;
  errors: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  info: AccessibilityIssue[];
  score: number; // 0-100
}

/**
 * Audit ARIA labels on interactive elements
 */
function auditInteractiveElements(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check buttons without accessible names
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute("aria-label");
    const hasAriaLabelledBy = button.getAttribute("aria-labelledby");
    const hasTitle = button.getAttribute("title");

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      issues.push({
        severity: "error",
        element: `button[${index}]`,
        issue: "Button has no accessible name",
        recommendation:
          "Add text content, aria-label, aria-labelledby, or title attribute",
        wcagCriterion: "4.1.2 Name, Role, Value",
      });
    }
  });

  // Check links without accessible names
  const links = document.querySelectorAll("a");
  links.forEach((link, index) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute("aria-label");
    const hasAriaLabelledBy = link.getAttribute("aria-labelledby");

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        severity: "error",
        element: `a[${index}] href="${link.getAttribute("href")}"`,
        issue: "Link has no accessible name",
        recommendation:
          "Add text content, aria-label, or aria-labelledby attribute",
        wcagCriterion: "2.4.4 Link Purpose",
      });
    }
  });

  // Check inputs without labels
  const inputs = document.querySelectorAll('input:not([type="hidden"])');
  inputs.forEach((input, index) => {
    const id = input.getAttribute("id");
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute("aria-label");
    const hasAriaLabelledBy = input.getAttribute("aria-labelledby");

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        severity: "error",
        element: `input[${index}] type="${input.getAttribute("type")}"`,
        issue: "Input has no associated label",
        recommendation:
          "Add a <label> element or aria-label/aria-labelledby attribute",
        wcagCriterion: "3.3.2 Labels or Instructions",
      });
    }
  });

  return issues;
}

/**
 * Audit images for alt text
 */
function auditImages(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = document.querySelectorAll("img");

  images.forEach((img, index) => {
    const alt = img.getAttribute("alt");
    const ariaLabel = img.getAttribute("aria-label");
    const ariaHidden = img.getAttribute("aria-hidden");
    const role = img.getAttribute("role");

    // Decorative images should have alt="" or aria-hidden="true"
    const isDecorative = ariaHidden === "true" || role === "presentation";

    if (!isDecorative && alt === null && !ariaLabel) {
      issues.push({
        severity: "error",
        element: `img[${index}] src="${img.getAttribute("src")}"`,
        issue: "Image missing alt attribute",
        recommendation:
          'Add alt text describing the image, or alt="" if decorative',
        wcagCriterion: "1.1.1 Non-text Content",
      });
    } else if (!isDecorative && alt === "") {
      issues.push({
        severity: "warning",
        element: `img[${index}] src="${img.getAttribute("src")}"`,
        issue: "Image has empty alt text - should this be decorative?",
        recommendation:
          'Add descriptive alt text or mark as aria-hidden="true" if decorative',
        wcagCriterion: "1.1.1 Non-text Content",
      });
    }
  });

  return issues;
}

/**
 * Audit headings structure
 */
function auditHeadings(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  );

  // Check for multiple h1 elements
  const h1Count = headings.filter((h) => h.tagName === "H1").length;
  if (h1Count === 0) {
    issues.push({
      severity: "error",
      element: "document",
      issue: "No h1 heading found on page",
      recommendation: "Add a main h1 heading to describe the page content",
      wcagCriterion: "2.4.6 Headings and Labels",
    });
  } else if (h1Count > 1) {
    issues.push({
      severity: "warning",
      element: "document",
      issue: `Multiple h1 headings found (${h1Count})`,
      recommendation: "Consider using only one h1 heading per page",
      wcagCriterion: "2.4.6 Headings and Labels",
    });
  }

  // Check for skipped heading levels
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));

    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        severity: "warning",
        element: `${heading.tagName.toLowerCase()}[${index}]`,
        issue: `Heading level skipped from h${previousLevel} to h${level}`,
        recommendation: "Use heading levels in sequential order",
        wcagCriterion: "1.3.1 Info and Relationships",
      });
    }

    previousLevel = level;
  });

  return issues;
}

/**
 * Audit ARIA live regions
 */
function auditLiveRegions(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const liveRegions = document.querySelectorAll("[aria-live]");

  liveRegions.forEach((region, index) => {
    const ariaLive = region.getAttribute("aria-live");
    const role = region.getAttribute("role");

    // Check for valid aria-live values
    if (!["polite", "assertive", "off"].includes(ariaLive || "")) {
      issues.push({
        severity: "error",
        element: `[aria-live][${index}]`,
        issue: `Invalid aria-live value: "${ariaLive}"`,
        recommendation: 'Use "polite", "assertive", or "off"',
        wcagCriterion: "4.1.3 Status Messages",
      });
    }

    // Recommend role="status" or role="alert"
    if (ariaLive === "polite" && !role) {
      issues.push({
        severity: "info",
        element: `[aria-live="polite"][${index}]`,
        issue: 'Consider adding role="status"',
        recommendation: 'Add role="status" to improve semantics',
        wcagCriterion: "4.1.3 Status Messages",
      });
    }

    if (ariaLive === "assertive" && role !== "alert") {
      issues.push({
        severity: "info",
        element: `[aria-live="assertive"][${index}]`,
        issue: 'Consider using role="alert"',
        recommendation: 'Add role="alert" for urgent messages',
        wcagCriterion: "4.1.3 Status Messages",
      });
    }
  });

  return issues;
}

/**
 * Audit form validation
 */
function auditFormValidation(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check required inputs
  const requiredInputs = document.querySelectorAll(
    "input[required], select[required], textarea[required]",
  );
  requiredInputs.forEach((input, index) => {
    const ariaRequired = input.getAttribute("aria-required");

    if (!ariaRequired) {
      issues.push({
        severity: "info",
        element: `input[required][${index}]`,
        issue: "Required input missing aria-required attribute",
        recommendation:
          'Add aria-required="true" for better screen reader support',
        wcagCriterion: "3.3.2 Labels or Instructions",
      });
    }
  });

  // Check invalid inputs
  const invalidInputs = document.querySelectorAll('[aria-invalid="true"]');
  invalidInputs.forEach((input, index) => {
    const ariaDescribedBy = input.getAttribute("aria-describedby");

    if (!ariaDescribedBy) {
      issues.push({
        severity: "warning",
        element: `[aria-invalid][${index}]`,
        issue: "Invalid input missing error message association",
        recommendation: "Add aria-describedby pointing to error message",
        wcagCriterion: "3.3.1 Error Identification",
      });
    }
  });

  return issues;
}

/**
 * Audit landmark regions
 */
function auditLandmarks(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for main landmark
  const mainLandmark = document.querySelector('main, [role="main"]');
  if (!mainLandmark) {
    issues.push({
      severity: "error",
      element: "document",
      issue: "No main landmark found",
      recommendation:
        'Add <main> element or role="main" to identify main content',
      wcagCriterion: "1.3.1 Info and Relationships",
    });
  }

  // Check for navigation landmark
  const navLandmark = document.querySelector('nav, [role="navigation"]');
  if (!navLandmark) {
    issues.push({
      severity: "warning",
      element: "document",
      issue: "No navigation landmark found",
      recommendation:
        'Add <nav> element or role="navigation" for main navigation',
      wcagCriterion: "1.3.1 Info and Relationships",
    });
  }

  // Check for multiple landmarks of same type without labels
  const mainLandmarks = document.querySelectorAll('main, [role="main"]');
  if (mainLandmarks.length > 1) {
    mainLandmarks.forEach((landmark, index) => {
      const ariaLabel = landmark.getAttribute("aria-label");
      const ariaLabelledBy = landmark.getAttribute("aria-labelledby");

      if (!ariaLabel && !ariaLabelledBy) {
        issues.push({
          severity: "warning",
          element: `main[${index}]`,
          issue: "Multiple main landmarks without distinguishing labels",
          recommendation:
            "Add aria-label to distinguish between multiple main landmarks",
          wcagCriterion: "2.4.1 Bypass Blocks",
        });
      }
    });
  }

  return issues;
}

/**
 * Audit tables
 */
function auditTables(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const tables = document.querySelectorAll("table");

  tables.forEach((table, index) => {
    // Check for caption or aria-label
    const caption = table.querySelector("caption");
    const ariaLabel = table.getAttribute("aria-label");
    const ariaLabelledBy = table.getAttribute("aria-labelledby");

    if (!caption && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        severity: "warning",
        element: `table[${index}]`,
        issue: "Table missing caption or label",
        recommendation:
          "Add <caption> element or aria-label to describe table content",
        wcagCriterion: "1.3.1 Info and Relationships",
      });
    }

    // Check for thead
    const thead = table.querySelector("thead");
    if (!thead) {
      issues.push({
        severity: "warning",
        element: `table[${index}]`,
        issue: "Table missing <thead> element",
        recommendation: "Wrap header row in <thead> for better structure",
        wcagCriterion: "1.3.1 Info and Relationships",
      });
    }

    // Check for th elements
    const thElements = table.querySelectorAll("th");
    if (thElements.length === 0) {
      issues.push({
        severity: "error",
        element: `table[${index}]`,
        issue: "Table has no header cells (th)",
        recommendation: "Use <th> elements for table headers instead of <td>",
        wcagCriterion: "1.3.1 Info and Relationships",
      });
    }
  });

  return issues;
}

/**
 * Run complete accessibility audit
 */
export function runAccessibilityAudit(): AccessibilityAuditResult {
  const allIssues: AccessibilityIssue[] = [
    ...auditInteractiveElements(),
    ...auditImages(),
    ...auditHeadings(),
    ...auditLiveRegions(),
    ...auditFormValidation(),
    ...auditLandmarks(),
    ...auditTables(),
  ];

  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");
  const info = allIssues.filter((i) => i.severity === "info");

  // Calculate score (100 = perfect, 0 = terrible)
  // Errors are weighted heavily, warnings less so, info items don't affect score
  const errorPenalty = errors.length * 10;
  const warningPenalty = warnings.length * 3;
  const totalPenalty = errorPenalty + warningPenalty;
  const score = Math.max(0, 100 - totalPenalty);

  return {
    totalIssues: allIssues.length,
    errors,
    warnings,
    info,
    score,
  };
}

/**
 * Print audit results to console
 */
export function printAuditResults(results: AccessibilityAuditResult): void {
  console.group("🔍 Accessibility Audit Results");

  console.log(`\n📊 Score: ${results.score}/100`);
  console.log(`📋 Total Issues: ${results.totalIssues}`);
  console.log(`  ❌ Errors: ${results.errors.length}`);
  console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`  ℹ️  Info: ${results.info.length}`);

  if (results.errors.length > 0) {
    console.group("\n❌ Errors (WCAG Failures)");
    results.errors.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.element}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Fix: ${issue.recommendation}`);
      if (issue.wcagCriterion) {
        console.log(`   WCAG: ${issue.wcagCriterion}`);
      }
    });
    console.groupEnd();
  }

  if (results.warnings.length > 0) {
    console.group("\n⚠️  Warnings (Best Practices)");
    results.warnings.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.element}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Fix: ${issue.recommendation}`);
    });
    console.groupEnd();
  }

  if (results.info.length > 0) {
    console.group("\nℹ️  Info (Recommendations)");
    results.info.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.element}`);
      console.log(`   Suggestion: ${issue.recommendation}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Enable live accessibility monitoring (development only)
 */
export function enableLiveAccessibilityMonitoring(): void {
  if (process.env.NODE_ENV !== "development") {
    console.warn(
      "Live accessibility monitoring is only available in development mode",
    );
    return;
  }

  // Run audit on DOM changes
  const observer = new MutationObserver(() => {
    const results = runAccessibilityAudit();
    if (results.errors.length > 0 || results.warnings.length > 0) {
      printAuditResults(results);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "alt",
      "role",
    ],
  });

  console.log("✅ Live accessibility monitoring enabled");
}
