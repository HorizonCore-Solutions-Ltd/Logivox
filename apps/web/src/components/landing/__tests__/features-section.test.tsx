import { render, screen } from '@testing-library/react'
import { FeaturesSection } from '../features-section'

describe('FeaturesSection', () => {
  it('renders the section headline', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText(/Everything you need for/i)).toBeInTheDocument()
    expect(screen.getByText('enterprise operations')).toBeInTheDocument()
  })

  it('displays primary features with icons and descriptions', () => {
    render(<FeaturesSection />)
    
    // Check for feature titles
    expect(screen.getByText('Zero-Trust Security')).toBeInTheDocument()
    expect(screen.getByText('Real-time Synchronization')).toBeInTheDocument()
    expect(screen.getByText('Multi-Tenant Architecture')).toBeInTheDocument()
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument()
  })

  it('shows feature benefits', () => {
    render(<FeaturesSection />)
    
    // Use getAllByText for duplicate content and check count
    expect(screen.getAllByText(/End-to-end encryption/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Instant data sync/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Complete data isolation/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Real-time dashboards/i).length).toBeGreaterThan(0)
  })

  it('displays additional features', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText('ERP Integrations')).toBeInTheDocument()
    expect(screen.getByText('Global Scale')).toBeInTheDocument()
    expect(screen.getByText('Compliance Ready')).toBeInTheDocument()
    expect(screen.getByText('Team Collaboration')).toBeInTheDocument()
    expect(screen.getByText('24/7 Monitoring')).toBeInTheDocument()
    expect(screen.getByText('API-First Design')).toBeInTheDocument()
  })

  it('has link to integrations page', () => {
    render(<FeaturesSection />)
    
    const integrationsLink = screen.getByRole('link', { name: /view all integrations/i })
    expect(integrationsLink).toBeInTheDocument()
    expect(integrationsLink).toHaveAttribute('href', '/integrations')
  })
})
