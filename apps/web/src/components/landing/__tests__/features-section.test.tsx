import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "../features-section";

describe("FeaturesSection", () => {
  it("renders the section headline", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/Everything Competitors Charge Extra For/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Included in Every Plan/i)).toBeInTheDocument();
  });

  it("displays primary features with icons and descriptions", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Quality Management")).toBeInTheDocument();
    expect(
      screen.getByText("Quality Control & Inspection"),
    ).toBeInTheDocument();
    expect(screen.getByText("Returns Processing")).toBeInTheDocument();
    expect(screen.getByText("Receiving & Putaway")).toBeInTheDocument();
  });

  it("shows feature benefits", () => {
    render(<FeaturesSection />);

    expect(screen.getByText(/Voice Commands/)).toBeInTheDocument();
    expect(screen.getByText(/Label Designer/)).toBeInTheDocument();
    expect(screen.getByText(/Security Training/)).toBeInTheDocument();
  });

  it("displays additional features", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText("Predictive Ops & Anomaly Defense"),
    ).toBeInTheDocument();
    expect(screen.getByText("Offline & Edge Resilience")).toBeInTheDocument();
    expect(screen.getByText("Copilot for SOPs & Training")).toBeInTheDocument();
    expect(screen.getByText("Zero-Trust Everywhere")).toBeInTheDocument();
  });

  it("has link to integrations page", () => {
    render(<FeaturesSection />);

    const integrationsLink = screen.getByRole("link", {
      name: /view all integrations/i,
    });
    expect(integrationsLink).toBeInTheDocument();
    expect(integrationsLink).toHaveAttribute("href", "/platform/integrations");
  });
});
