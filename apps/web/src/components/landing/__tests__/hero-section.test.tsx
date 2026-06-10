import { render, screen } from "@testing-library/react";
import { HeroSection } from "../hero-section";

describe("HeroSection", () => {
  it("renders the hero headline", () => {
    render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Enterprise Operations.*with voice at the center/i,
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
      screen.getByText(/Run your warehouse without touching a screen/i),
    ).toBeInTheDocument();
  });

  it("shows enterprise statistics", () => {
    render(<HeroSection />);

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Traceable")).toBeInTheDocument();
    expect(screen.getByText("Adaptive")).toBeInTheDocument();
  });

  it("displays trust indicators", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/continuously evolving intelligence layer/i),
    ).toBeInTheDocument();
  });
});
