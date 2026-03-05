import { render, screen } from "@testing-library/react";
import { HeroSection } from "../hero-section";

describe("HeroSection", () => {
  it("renders the hero headline", () => {
    render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Enterprise Voice-Native.*Warehouse Management/i,
    );
  });

  it("renders CTA buttons", () => {
    render(<HeroSection />);

    const demoButton = screen.getByRole("link", {
      name: /request enterprise demo/i,
    });
    const contactButton = screen.getByRole("link", {
      name: /contact sales team/i,
    });

    expect(demoButton).toBeInTheDocument();
    expect(demoButton).toHaveAttribute("href", "/contact");

    expect(contactButton).toBeInTheDocument();
    expect(contactButton).toHaveAttribute("href", "/contact");
  });

  it("displays feature highlights", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/Production-ready WMS with 489 API endpoints/i),
    ).toBeInTheDocument();
  });

  it("shows enterprise statistics", () => {
    render(<HeroSection />);

    expect(screen.getByText("489"));
    // "API Endpoints" appears multiple times (subtext + stat card), so we check if any exist
    const apiEndpointsElements = screen.getAllByText(/API Endpoints/i);
    expect(apiEndpointsElements.length).toBeGreaterThan(0);

    expect(screen.getByText("42"));
    expect(screen.getAllByText(/Dashboards/i)[0]).toBeInTheDocument();
    
    expect(screen.getByText(/99.99%/)).toBeInTheDocument();
  });

  it("displays trust indicators", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/Built for Fortune 500 companies/i),
    ).toBeInTheDocument();
  });
});
