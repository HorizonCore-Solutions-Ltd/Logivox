# Screen Reader Optimization - Implementation Guide

## Overview

Comprehensive screen reader support implementation for FlowStock, ensuring WCAG 2.1 Level AA compliance and excellent experience with assistive technologies.

---

## Components Created

### 1. **Screen Reader Utilities** (`lib/screen-reader.ts`)

Comprehensive utility library with 40+ functions for screen reader support:

#### **ARIA Label Generators**
```typescript
// Pre-defined labels for common UI patterns
ariaLabels.navigation.main  // "Main navigation"
ariaLabels.actions.delete   // "Delete"
ariaLabels.status.loading   // "Loading..."

// Dynamic label generators
getIconButtonLabel('Delete', 'Product ABC')  // "Delete Product ABC"
getTableActionLabel('edit', 'product', 'Laptop')  // "Edit product Laptop"
getPaginationLabel(5, true)  // "Page 5, current page"
getSortLabel('Name', 'asc')  // "Sort by Name, ascending"
```

#### **Live Region Announcements**
```typescript
// Announce messages to screen readers
announceToScreenReader('Item added to cart', 'polite');
announceToScreenReader('Error: Form submission failed', 'assertive');

// Hook for announcements
const { announce } = useScreenReaderAnnouncement();
announce('Data loaded successfully');
```

#### **Loading State Announcements**
```typescript
const { announceError } = useLoadingAnnouncement({
  isLoading,
  loadingMessage: 'Loading products...',
  successMessage: 'Products loaded successfully',
  errorMessage: 'Failed to load products'
});
```

#### **Form Validation Announcements**
```typescript
const { announceError, announceSuccess } = useFormValidationAnnouncement();

announceError('Email', 'Email is required');
announceSuccess('Contact Form');
```

#### **Table Announcements**
```typescript
const { announceLoaded, announceSorted, announceFiltered } = 
  useTableAnnouncement('product');

announceLoaded(50);    // "Loaded 50 products"
announceSorted(50);    // "Table sorted, showing 50 products"
announceFiltered(10);  // "Filtered to 10 products"
```

#### **Modal Announcements**
```typescript
const { announceOpen } = useModalAnnouncement('Edit Product');
announceModalState(isOpen, 'Settings');
```

#### **Navigation Announcements**
```typescript
const { announce } = useRouteAnnouncement();
announce('Dashboard');  // "Navigated to Dashboard"
```

#### **Progress Announcements**
```typescript
announceProgress(50, 100, 'Upload');  // "Upload: 50% complete"
```

#### **Alt Text Generators**
```typescript
getAvatarAltText('John Doe', true);  // "John Doe's profile picture"
getStatusIconAltText('success');     // "Success icon"
getChartAltText('bar', 12, 'increasing');  // "Bar chart with 12 data points, showing increasing trend"
```

#### **Format Helpers**
```typescript
formatNumberForScreenReader(1234567);  // "1,234,567"
formatCurrencyForScreenReader(1234.56);  // "$1,234.56 dollars"
formatDateForScreenReader(new Date());  // "October 15, 2025"
formatTimeForScreenReader(new Date());  // "2:30 PM"
```

---

### 2. **ARIA Components** (`components/accessibility/aria-components.tsx`)

Reusable accessible components with built-in ARIA attributes:

#### **VisuallyHidden**
```tsx
<VisuallyHidden>Additional context for screen readers</VisuallyHidden>
```

#### **LoadingSpinner**
```tsx
<LoadingSpinner label="Loading products..." size="md" />
```

#### **StatusBadge**
```tsx
<StatusBadge status="success" icon={<Check />}>
  Approved
</StatusBadge>
```

#### **ErrorMessage**
```tsx
<input aria-invalid="true" aria-describedby="error-1" />
<ErrorMessage id="error-1" icon={<AlertCircle />}>
  Email is required
</ErrorMessage>
```

#### **SuccessMessage**
```tsx
<SuccessMessage icon={<CheckCircle />}>
  Form submitted successfully
</SuccessMessage>
```

#### **EmptyState**
```tsx
<EmptyState
  title="No products found"
  description="Try adjusting your filters"
  icon={<Package className="h-12 w-12" />}
  action={<Button>Add Product</Button>}
/>
```

#### **TableCaption**
```tsx
<table>
  <TableCaption>List of products in inventory</TableCaption>
  {/* table content */}
</table>
```

#### **RequiredIndicator / OptionalIndicator**
```tsx
<label>
  Email <RequiredIndicator />
</label>

<label>
  Phone <OptionalIndicator />
</label>
```

#### **ProgressBar**
```tsx
<ProgressBar
  value={75}
  max={100}
  label="Upload Progress"
  showPercentage
  size="md"
/>
```

#### **AccessibleCard**
```tsx
<AccessibleCard
  title="Product Details"
  description="View and edit product information"
  as="article"
  headingLevel="h3"
>
  {/* card content */}
</AccessibleCard>
```

---

### 3. **Accessibility Audit Tool** (`lib/accessibility-audit.ts`)

Development tool for auditing WCAG compliance:

#### **Run Audit**
```typescript
import { runAccessibilityAudit, printAuditResults } from '@/lib/accessibility-audit';

// Run audit
const results = runAccessibilityAudit();

// Print to console
printAuditResults(results);

// Results include:
// - totalIssues: number
// - errors: Array (WCAG failures)
// - warnings: Array (best practices)
// - info: Array (recommendations)
// - score: number (0-100)
```

#### **Audit Checks**
- ✅ Interactive elements have accessible names
- ✅ Images have alt text
- ✅ Headings structure is correct
- ✅ ARIA live regions are valid
- ✅ Form validation is accessible
- ✅ Landmark regions are present
- ✅ Tables have proper structure

#### **Live Monitoring** (Development Only)
```typescript
import { enableLiveAccessibilityMonitoring } from '@/lib/accessibility-audit';

// Enable live monitoring
enableLiveAccessibilityMonitoring();

// Automatically audits DOM changes and logs issues
```

---

## Implementation Checklist

### **For New Components**

- [ ] Add ARIA labels to all buttons
  ```tsx
  <button aria-label="Delete product">
    <Trash className="h-4 w-4" />
  </button>
  ```

- [ ] Associate form labels with inputs
  ```tsx
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  ```

- [ ] Mark decorative images
  ```tsx
  <img src="decoration.png" alt="" aria-hidden="true" />
  ```

- [ ] Use semantic HTML
  ```tsx
  <main>
    <h1>Page Title</h1>
    <nav aria-label="Main navigation">...</nav>
    <article>...</article>
  </main>
  ```

- [ ] Add loading announcements
  ```tsx
  const { announceError } = useLoadingAnnouncement({
    isLoading,
    loadingMessage: 'Loading...',
    successMessage: 'Loaded successfully'
  });
  ```

- [ ] Announce dynamic updates
  ```tsx
  const { announce } = useScreenReaderAnnouncement();
  
  useEffect(() => {
    if (dataUpdated) {
      announce('Data updated successfully');
    }
  }, [dataUpdated]);
  ```

### **For Forms**

- [ ] Associate error messages
  ```tsx
  <input
    aria-invalid={!!error}
    aria-describedby={error ? 'error-1' : undefined}
  />
  {error && <ErrorMessage id="error-1">{error}</ErrorMessage>}
  ```

- [ ] Mark required fields
  ```tsx
  <label>
    Email <RequiredIndicator />
  </label>
  <input required aria-required="true" />
  ```

- [ ] Announce validation errors
  ```tsx
  const { announceError } = useFormValidationAnnouncement();
  
  if (errors.email) {
    announceError('Email', errors.email);
  }
  ```

### **For Tables**

- [ ] Add table caption
  ```tsx
  <table>
    <TableCaption>List of inventory items</TableCaption>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
  ```

- [ ] Use proper table structure
  ```tsx
  <table>
    <thead>
      <tr>
        <th scope="col">Product</th>
        <th scope="col">Quantity</th>
      </tr>
    </thead>
    <tbody>...</tbody>
  </table>
  ```

- [ ] Announce table updates
  ```tsx
  const { announceLoaded, announceSorted } = useTableAnnouncement('product');
  
  useEffect(() => {
    announceLoaded(products.length);
  }, [products]);
  ```

### **For Modals/Dialogs**

- [ ] Use proper ARIA attributes
  ```tsx
  <Dialog>
    <DialogContent
      role="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <DialogTitle id="dialog-title">...</DialogTitle>
      <DialogDescription id="dialog-description">...</DialogDescription>
    </DialogContent>
  </Dialog>
  ```

- [ ] Announce modal state
  ```tsx
  const { announceOpen } = useModalAnnouncement('Edit Product');
  
  useEffect(() => {
    if (isOpen) {
      announceOpen();
    }
  }, [isOpen]);
  ```

---

## Testing Checklist

### **Screen Reader Testing**

- [ ] **JAWS** (Windows, most popular)
  - Test with Chrome/Edge
  - Verify all interactive elements are announced
  - Check form validation announcements
  - Test table navigation (Ctrl+Alt+Arrow keys)

- [ ] **NVDA** (Windows, free)
  - Test with Firefox
  - Verify heading navigation (H key)
  - Check landmark navigation (D, F, N keys)
  - Test button/link navigation (B, K keys)

- [ ] **VoiceOver** (macOS)
  - Test with Safari
  - Verify VO+Right Arrow navigation
  - Check VO+Command+H heading navigation
  - Test VO+U rotor navigation

- [ ] **TalkBack** (Android)
  - Test swipe navigation
  - Verify double-tap activation
  - Check reading order

### **Keyboard Navigation Testing**

- [ ] Tab through all interactive elements
- [ ] Verify focus visible on all elements
- [ ] Test arrow key navigation in dropdowns/menus
- [ ] Test Escape to close modals
- [ ] Test Enter/Space to activate buttons
- [ ] Verify no keyboard traps

### **Automated Testing**

```bash
# Run accessibility audit in console
const results = runAccessibilityAudit();
printAuditResults(results);

# Enable live monitoring during development
enableLiveAccessibilityMonitoring();
```

---

## WCAG 2.1 AA Compliance Matrix

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| **1.1.1 Non-text Content** | ✅ | Alt text generators, decorative image marking |
| **1.3.1 Info and Relationships** | ✅ | Semantic HTML, ARIA labels, table structure |
| **1.3.2 Meaningful Sequence** | ✅ | Proper heading hierarchy, logical tab order |
| **1.3.3 Sensory Characteristics** | ✅ | Text labels, not relying on shape/color alone |
| **1.4.3 Contrast (Minimum)** | ✅ | 4.5:1 contrast ratio enforced |
| **2.1.1 Keyboard** | ✅ | All functionality keyboard accessible |
| **2.1.2 No Keyboard Trap** | ✅ | Focus management, escape key support |
| **2.4.1 Bypass Blocks** | ✅ | Skip links, landmark regions |
| **2.4.2 Page Titled** | ✅ | Metadata in layout |
| **2.4.3 Focus Order** | ✅ | Logical tab order |
| **2.4.4 Link Purpose** | ✅ | Descriptive link text, aria-labels |
| **2.4.6 Headings and Labels** | ✅ | Semantic headings, form labels |
| **2.4.7 Focus Visible** | ✅ | Enhanced focus indicators |
| **3.1.1 Language of Page** | ✅ | lang="en" attribute |
| **3.2.1 On Focus** | ✅ | No automatic context changes |
| **3.2.2 On Input** | ✅ | Explicit form submission |
| **3.3.1 Error Identification** | ✅ | Error messages, aria-invalid |
| **3.3.2 Labels or Instructions** | ✅ | Form labels, help text |
| **4.1.1 Parsing** | ✅ | Valid HTML |
| **4.1.2 Name, Role, Value** | ✅ | ARIA attributes on all elements |
| **4.1.3 Status Messages** | ✅ | Live regions, announcements |

---

## Quick Reference

### **Most Common Patterns**

```tsx
// Icon-only button
<button aria-label={getIconButtonLabel('Delete', item.name)}>
  <Trash className="h-4 w-4" />
</button>

// Loading state
<LoadingSpinner label="Loading products..." />

// Form field
<label htmlFor="email">
  Email <RequiredIndicator />
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <ErrorMessage id="email-error">{errors.email}</ErrorMessage>
)}

// Table
<table>
  <TableCaption srOnly>List of products</TableCaption>
  <thead>
    <tr>
      <th scope="col">Product</th>
      <th scope="col">Quantity</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>

// Status
<StatusBadge status="success" icon={<Check />}>
  Active
</StatusBadge>

// Empty state
<EmptyState
  title="No results found"
  description="Try adjusting your search"
  icon={<Search className="h-12 w-12" />}
/>
```

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Support

For questions or issues with accessibility implementation:
- Email: accessibility@flowstock.com
- Review accessibility audit results in development console
- Enable live monitoring during development
