'use client'

/**
 * Skip Links Component
 * Provides keyboard users with quick navigation to important page sections
 * Links are hidden until focused, then appear at the top of the page
 */

import Link from 'next/link'
import { DEFAULT_SKIP_LINKS, handleSkipLinkClick, type SkipLink } from '@/lib/accessibility'

interface SkipLinksProps {
  /**
   * Custom skip links to display (defaults to DEFAULT_SKIP_LINKS)
   */
  links?: SkipLink[]
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Skip Links - Accessibility feature for keyboard navigation
 * 
 * Provides quick links to jump to main content sections, bypassing
 * repetitive navigation. Links are visually hidden until focused.
 * 
 * @example
 * ```tsx
 * <SkipLinks />
 * ```
 */
export function SkipLinks({ links = DEFAULT_SKIP_LINKS, className }: SkipLinksProps) {
  return (
    <nav
      aria-label="Skip links"
      className={className}
    >
      <ul className="sr-only-focusable">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.target}`}
              onClick={(e) => handleSkipLinkClick(e, link.target)}
              className="skip-link"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Skip Link Target Component
 * Marks a section as a skip link target
 * 
 * @example
 * ```tsx
 * <SkipLinkTarget id="main-content">
 *   <main>...</main>
 * </SkipLinkTarget>
 * ```
 */
export function SkipLinkTarget({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div id={id} tabIndex={-1} className={className}>
      {children}
    </div>
  )
}
