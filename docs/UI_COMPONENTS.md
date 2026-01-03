# UI Components Guide

## Table of Contents
1. [Component Library Overview](#component-library-overview)
2. [Design System](#design-system)
3. [Core Components](#core-components)
4. [Form Components](#form-components)
5. [Data Display](#data-display)
6. [Feedback Components](#feedback-components)
7. [Layout Components](#layout-components)
8. [Usage Examples](#usage-examples)

---

## Component Library Overview

LogiVox uses a custom component library built on Tailwind CSS and Radix UI primitives, providing a consistent, accessible, and beautiful user experience.

### Tech Stack

- **Styling:** Tailwind CSS (utility-first CSS framework)
- **UI Primitives:** Radix UI (accessible component primitives)
- **Icons:** Lucide React (consistent icon library)
- **Forms:** React Hook Form + Zod validation
- **State:** React hooks + Context API
- **Animations:** Tailwind CSS animations

### Installation

Components are located in `/components` and organized by category:

```
components/
├── ui/           # Core UI components
├── forms/        # Form-specific components
├── layout/       # Layout components
├── mobile/       # Mobile-optimized components
└── load-optimization/  # Domain-specific components
```

---

## Design System

### Colors

```typescript
// Tailwind config
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',  // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: {
    500: '#22c55e',
  },
  warning: {
    500: '#f59e0b',
  },
  error: {
    500: '#ef4444',
  },
  neutral: {
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  },
};
```

### Typography

```typescript
// Font sizes
text-xs    // 0.75rem (12px)
text-sm    // 0.875rem (14px)
text-base  // 1rem (16px)
text-lg    // 1.125rem (18px)
text-xl    // 1.25rem (20px)
text-2xl   // 1.5rem (24px)
text-3xl   // 1.875rem (30px)
text-4xl   // 2.25rem (36px)

// Font weights
font-normal   // 400
font-medium   // 500
font-semibold // 600
font-bold     // 700
```

### Spacing

```typescript
// Margin and padding scale (based on 4px)
p-1  // 0.25rem (4px)
p-2  // 0.5rem (8px)
p-4  // 1rem (16px)
p-6  // 1.5rem (24px)
p-8  // 2rem (32px)
p-12 // 3rem (48px)
```

### Breakpoints

```typescript
sm: '640px'   // Small devices (tablets)
md: '768px'   // Medium devices (small laptops)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large devices
2xl: '1536px' // Ultra-wide screens
```

---

## Core Components

### Button

Primary interactive element for actions.

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
      secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus-visible:ring-neutral-500',
      outline: 'border-2 border-neutral-300 bg-transparent hover:bg-neutral-100 focus-visible:ring-neutral-500',
      ghost: 'hover:bg-neutral-100 focus-visible:ring-neutral-500',
      danger: 'bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500',
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
```

**Usage:**

```tsx
import Button from '@/components/ui/Button';

// Primary button
<Button onClick={handleSubmit}>Submit</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">Edit</Button>

// Small size
<Button size="sm">Small Button</Button>

// Loading state
<Button isLoading={isSubmitting}>Save</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>Delete</Button>
```

### Badge

Display status indicators and labels.

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-900',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
```

**Usage:**

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>
<Badge variant="info">Draft</Badge>
```

### Card

Container for related content.

```tsx
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-neutral-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-neutral-900', className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={cn('mt-4 flex items-center justify-end gap-2', className)}>{children}</div>;
}
```

**Usage:**

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Order #12345</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Order details...</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Approve</Button>
  </CardFooter>
</Card>
```

---

## Form Components

### Input

Text input field with validation support.

```tsx
// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm transition-colors',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
```

**Usage:**

```tsx
import Input from '@/components/ui/Input';

// Basic input
<Input label="Email" type="email" placeholder="you@example.com" />

// With error
<Input label="Password" type="password" error="Password is required" />

// With helper text
<Input label="Username" helperText="Minimum 3 characters" />

// Required field
<Input label="Name" required />

// With React Hook Form
const { register, formState: { errors } } = useForm();
<Input
  label="Email"
  {...register('email')}
  error={errors.email?.message}
/>
```

### Select

Dropdown selection component.

```tsx
// components/ui/Select.tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm transition-colors',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);
```

**Usage:**

```tsx
<Select
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
  placeholder="Select status"
/>
```

### Checkbox

Checkbox input with label.

```tsx
// components/ui/Checkbox.tsx
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600',
            'focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="ml-2">
            {label && <label className="text-sm font-medium text-neutral-900">{label}</label>}
            {description && <p className="text-xs text-neutral-500">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);
```

**Usage:**

```tsx
<Checkbox label="Remember me" />
<Checkbox
  label="Enable notifications"
  description="Receive email notifications for new orders"
/>
```

---

## Data Display

### Table

Display tabular data with sorting and pagination.

```tsx
// components/ui/Table.tsx
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-neutral-50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-neutral-200">{children}</tbody>;
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-neutral-50', className)}>{children}</tr>;
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-sm font-semibold text-neutral-900', className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-sm text-neutral-700', className)}>{children}</td>;
}
```

**Usage:**

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Order #</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Total</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {orders.map((order) => (
      <TableRow key={order.id}>
        <TableCell>{order.orderNumber}</TableCell>
        <TableCell>{order.customer.name}</TableCell>
        <TableCell>
          <Badge variant={order.status === 'COMPLETED' ? 'success' : 'warning'}>
            {order.status}
          </Badge>
        </TableCell>
        <TableCell>${order.totalAmount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### DataGrid

Advanced table with built-in filtering, sorting, and pagination.

```tsx
// components/ui/DataGrid.tsx
interface DataGridProps<T> {
  data: T[];
  columns: Array<{
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
  }>;
  pageSize?: number;
  isLoading?: boolean;
}

export function DataGrid<T>({ data, columns, pageSize = 10, isLoading }: DataGridProps<T>) {
  // Implementation with sorting, filtering, pagination
  // ...
}
```

---

## Feedback Components

### Toast

Show temporary notifications.

```tsx
// components/ui/Toast.tsx (using react-hot-toast)
import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  info: (message: string) => toast(message, { icon: 'ℹ️' }),
};
```

**Usage:**

```tsx
import { showToast } from '@/components/ui/Toast';

// Success toast
showToast.success('Order created successfully');

// Error toast
showToast.error('Failed to save changes');

// Loading toast
const toastId = showToast.loading('Processing...');
// Dismiss: toast.dismiss(toastId);
```

### Modal

Display overlay dialogs.

```tsx
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className={cn('relative z-10 w-full rounded-lg bg-white p-6 shadow-xl', sizes[size])}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

**Usage:**

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Delete">
  <p>Are you sure you want to delete this item?</p>
  <div className="mt-4 flex justify-end gap-2">
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>
```

---

## Layout Components

### PageHeader

Consistent page headers with breadcrumbs and actions.

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="mb-2 flex items-center gap-2 text-sm text-neutral-600">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-primary-600">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </div>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-neutral-600">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

**Usage:**

```tsx
<PageHeader
  title="Orders"
  description="Manage and track all your orders"
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Orders' },
  ]}
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>Create Order</Button>
    </>
  }
/>
```

---

## Usage Examples

### Complete Form Example

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

type FormData = z.infer<typeof schema>;

export function UserForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showToast.success('User created successfully');
    } else {
      showToast.error('Failed to create user');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            {...register('name')}
            error={errors.name?.message}
            required
          />
          
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
          />
          
          <Select
            label="Role"
            {...register('role')}
            options={[
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            placeholder="Select a role"
            error={errors.role?.message}
            required
          />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Owner:** Design & Engineering Teams
