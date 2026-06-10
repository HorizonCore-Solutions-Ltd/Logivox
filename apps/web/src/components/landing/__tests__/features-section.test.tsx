import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "../features-section";

describe("FeaturesSection", () => {
  it("renders the section headline", () => {
    render(<FeaturesSection />);

    expect(screen.getByText(/Five domains, one platform/i)).toBeInTheDocument();
    expect(
      screen.getByText(/built for clarity and control/i),
    ).toBeInTheDocument();
  });

  it("displays primary features with icons and descriptions", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Core Operations")).toBeInTheDocument();
    expect(screen.getByText("Intelligence & Automation")).toBeInTheDocument();
    expect(screen.getByText("Compliance & Quality")).toBeInTheDocument();
    expect(screen.getByText("Voice & Workforce")).toBeInTheDocument();
  });

  it("shows feature benefits", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/Voice as the primary operating interface/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Audit-ready execution across every action/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Certified connectors for existing systems/i),
    ).toBeInTheDocument();
  });

  it("displays additional features", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("System Control Center")).toBeInTheDocument();
    expect(screen.getByText("AI Decision Insights")).toBeInTheDocument();
    expect(screen.getByText("Workflow Visualizer")).toBeInTheDocument();
    expect(screen.getByText("Resilience Engine")).toBeInTheDocument();
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
