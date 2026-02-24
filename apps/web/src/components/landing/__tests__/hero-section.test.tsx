import { render, screen } from "@testing-library/react";
import { HeroSection } from "../hero-section";

describe("HeroSection", () => {
  it("renders the hero headline", () => {
    render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Run Your Warehouse.*With Your Voice/i,
    );
  });

  it("renders CTA buttons", () => {
    render(<HeroSection />);

    const startTrialButton = screen.getByRole("link", {
      name: /start your free 30-day trial/i,
    });
    const demoButton = screen.getByRole("link", {
      name: /schedule a personalized demo/i,
    });

    expect(startTrialButton).toBeInTheDocument();
    expect(startTrialButton).toHaveAttribute("href", "/sign-up");

    expect(demoButton).toBeInTheDocument();
    expect(demoButton).toHaveAttribute("href", "/demo");
  });

  it("displays feature highlights", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/95% Reduction in Picking Errors/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3x Faster Order Fulfillment/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/936% ROI in First Year/i)).toBeInTheDocument();
    expect(screen.getByText(/Predictive Ops/)).toBeInTheDocument();
  });

  it("shows enterprise statistics", () => {
    render(<HeroSection />);

    expect(screen.getByText("100%"));
    expect(screen.getByText(/Automation/i)).toBeInTheDocument();
    expect(screen.getByText(/44\+/)).toBeInTheDocument();
    expect(screen.getByText(/99.99%/)).toBeInTheDocument();
    expect(screen.getByText(/IT Headaches/i)).toBeInTheDocument();
  });

  it("displays trust indicators", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/Trusted by Fortune 500 companies/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/SOC 2 & ISO 27001 Certified/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/847 active warehouses today/i),
    ).toBeInTheDocument();
  });
});
