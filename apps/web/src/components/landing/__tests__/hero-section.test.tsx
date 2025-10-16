import { render, screen } from '@testing-library/react'
import { HeroSection } from '../hero-section'

describe('HeroSection', () => {
  it('renders the hero headline', () => {
    render(<HeroSection />)
    
    // Check for the complete headline text
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Enterprise.*Stock Booking.*Platform/i)
  })

  it('renders CTA buttons', () => {
    render(<HeroSection />)
    
    const startTrialButton = screen.getByRole('link', { name: /start free trial/i })
    const demoButton = screen.getByRole('link', { name: /watch demo/i })
    
    expect(startTrialButton).toBeInTheDocument()
    expect(startTrialButton).toHaveAttribute('href', '/sign-up')
    
    expect(demoButton).toBeInTheDocument()
    expect(demoButton).toHaveAttribute('href', '/demo')
  })

  it('displays feature highlights', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('Zero-Trust Security')).toBeInTheDocument()
    expect(screen.getByText('Real-time Sync')).toBeInTheDocument()
    expect(screen.getByText('Multi-Tenant')).toBeInTheDocument()
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument()
  })

  it('shows enterprise statistics', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('Enterprise Customers')).toBeInTheDocument()
    expect(screen.getByText('50M+')).toBeInTheDocument()
    expect(screen.getByText('Stock Items Managed')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('Uptime SLA')).toBeInTheDocument()
  })

  it('displays trust indicators', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('Fortune 500')).toBeInTheDocument()
    expect(screen.getByText('SOC 2 Compliant')).toBeInTheDocument()
    expect(screen.getByText('24/7 Support')).toBeInTheDocument()
  })
})
