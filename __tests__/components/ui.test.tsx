/**
 * Example Unit Tests for Components
 * Demonstrates 100% coverage patterns
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

describe("Button Component", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toHaveClass("bg-secondary");
  });

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-destructive");
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toHaveClass("border");
  });

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toHaveClass("hover:bg-accent");
  });

  it("renders with link variant", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button", { name: /link/i });
    expect(button).toHaveClass("underline-offset-4");
  });

  it("renders with small size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button", { name: /small/i });
    expect(button).toHaveClass("h-9");
  });

  it("renders with large size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button", { name: /large/i });
    expect(button).toHaveClass("h-11");
  });

  it("renders with icon size", () => {
    render(<Button size="icon">X</Button>);
    const button = screen.getByRole("button", { name: /x/i });
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole("button", { name: /click/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole("button", { name: /disabled/i });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders with custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});

describe("Alert Component", () => {
  it("renders with default variant", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("destructive");
  });

  it("renders with custom className", () => {
    render(
      <Alert className="custom-alert">
        <AlertTitle>Custom</AlertTitle>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("custom-alert");
  });

  it("renders title without description", () => {
    render(
      <Alert>
        <AlertTitle>Only Title</AlertTitle>
      </Alert>,
    );

    expect(screen.getByText("Only Title")).toBeInTheDocument();
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders description without title", () => {
    render(
      <Alert>
        <AlertDescription>Only Description</AlertDescription>
      </Alert>,
    );

    expect(screen.getByText("Only Description")).toBeInTheDocument();
  });
});

describe("Badge Component", () => {
  it("renders with default variant", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge).toHaveClass("bg-secondary");
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge).toHaveClass("bg-destructive");
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge).toHaveClass("border");
  });

  it("renders with custom className", () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("custom-badge");
  });

  it("renders with children elements", () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>,
    );

    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});

describe("Form Validation", () => {
  it("validates email format", () => {
    const validateEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("missing@domain")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
  });

  it("validates password strength", () => {
    const validatePassword = (password: string) => {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const re =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return re.test(password);
    };

    expect(validatePassword("ValidPass123!")).toBe(true);
    expect(validatePassword("weak")).toBe(false);
    expect(validatePassword("NoNumber!")).toBe(false);
    expect(validatePassword("noupppercase123!")).toBe(false);
    expect(validatePassword("NOLOWERCASE123!")).toBe(false);
    expect(validatePassword("NoSpecial123")).toBe(false);
  });

  it("validates required fields", () => {
    const validateRequired = (value: string) => {
      return value.trim().length > 0;
    };

    expect(validateRequired("value")).toBe(true);
    expect(validateRequired("")).toBe(false);
    expect(validateRequired("   ")).toBe(false);
  });

  it("validates numeric input", () => {
    const validateNumeric = (value: string) => {
      return !isNaN(Number(value)) && value.trim() !== "";
    };

    expect(validateNumeric("123")).toBe(true);
    expect(validateNumeric("0")).toBe(true);
    expect(validateNumeric("-5")).toBe(true);
    expect(validateNumeric("abc")).toBe(false);
    expect(validateNumeric("")).toBe(false);
  });
});

describe("Data Formatting", () => {
  it("formats currency", () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    expect(formatCurrency(1234.56)).toBe("$1,234.56");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(-100)).toBe("-$100.00");
  });

  it("formats dates", () => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    };

    const testDate = new Date("2024-01-15");
    expect(formatDate(testDate)).toBe("January 15, 2024");
  });

  it("formats phone numbers", () => {
    const formatPhone = (phone: string) => {
      const cleaned = phone.replace(/\D/g, "");
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
      return phone;
    };

    expect(formatPhone("1234567890")).toBe("(123) 456-7890");
    expect(formatPhone("(123) 456-7890")).toBe("(123) 456-7890");
    expect(formatPhone("123-456-7890")).toBe("(123) 456-7890");
  });
});

describe("Error Handling", () => {
  it("handles network errors gracefully", async () => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/nonexistent");
        if (!response.ok) throw new Error("Network error");
        return await response.json();
      } catch (error) {
        return { error: "Failed to fetch data" };
      }
    };

    const result = await fetchData();
    expect(result).toHaveProperty("error");
  });

  it("validates API response structure", () => {
    const validateResponse = (data: any) => {
      return (
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        "name" in data
      );
    };

    expect(validateResponse({ id: 1, name: "Test" })).toBe(true);
    expect(validateResponse(null)).toBe(false);
    expect(validateResponse({ id: 1 })).toBe(false);
    expect(validateResponse("string")).toBe(false);
  });
});
