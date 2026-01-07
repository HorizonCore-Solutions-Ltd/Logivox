/**
 * Utility Tests - Form Validation
 */

import {
  validateSKU,
  validateEmail,
  validatePhone,
  validatePostcode,
  validateQuantity,
  validatePrice,
  validateRequired,
  validateDate,
} from "@/lib/utils/validation";

describe("Form Validation Utilities", () => {
  describe("validateSKU", () => {
    it("should accept valid SKUs", () => {
      expect(validateSKU("SKU-001")).toBeNull();
      expect(validateSKU("ABC123")).toBeNull();
      expect(validateSKU("12345678")).toBeNull();
    });

    it("should reject empty SKU", () => {
      expect(validateSKU("")).toBe("SKU is required");
    });

    it("should reject SKU with special characters", () => {
      expect(validateSKU("SKU@123")).toBe(
        "SKU can only contain letters, numbers, and hyphens",
      );
    });

    it("should reject SKU too short", () => {
      expect(validateSKU("AB")).toBe("SKU must be at least 3 characters");
    });

    it("should reject SKU too long", () => {
      expect(validateSKU("A".repeat(51))).toBe(
        "SKU cannot exceed 50 characters",
      );
    });
  });

  describe("validateEmail", () => {
    it("should accept valid emails", () => {
      expect(validateEmail("test@example.com")).toBeNull();
      expect(validateEmail("user.name+tag@example.co.uk")).toBeNull();
    });

    it("should reject empty email", () => {
      expect(validateEmail("")).toBe("Email is required");
    });

    it("should reject invalid format", () => {
      expect(validateEmail("invalid")).toBe("Invalid email format");
      expect(validateEmail("@example.com")).toBe("Invalid email format");
      expect(validateEmail("test@")).toBe("Invalid email format");
    });
  });

  describe("validatePhone", () => {
    it("should accept valid UK phone numbers", () => {
      expect(validatePhone("07700 900000")).toBeNull();
      expect(validatePhone("0207 123 4567")).toBeNull();
      expect(validatePhone("+44 20 7123 4567")).toBeNull();
    });

    it("should reject empty phone", () => {
      expect(validatePhone("")).toBe("Phone number is required");
    });

    it("should reject invalid phone", () => {
      expect(validatePhone("123")).toBe("Invalid phone number format");
      expect(validatePhone("abcd")).toBe("Invalid phone number format");
    });
  });

  describe("validatePostcode", () => {
    it("should accept valid UK postcodes", () => {
      expect(validatePostcode("SW1A 1AA")).toBeNull();
      expect(validatePostcode("M1 1AE")).toBeNull();
      expect(validatePostcode("EC1A1BB")).toBeNull();
    });

    it("should reject empty postcode", () => {
      expect(validatePostcode("")).toBe("Postcode is required");
    });

    it("should reject invalid postcode", () => {
      expect(validatePostcode("INVALID")).toBe("Invalid UK postcode format");
      expect(validatePostcode("12345")).toBe("Invalid UK postcode format");
    });
  });

  describe("validateQuantity", () => {
    it("should accept valid quantities", () => {
      expect(validateQuantity(1)).toBeNull();
      expect(validateQuantity(100)).toBeNull();
      expect(validateQuantity(9999)).toBeNull();
    });

    it("should reject zero", () => {
      expect(validateQuantity(0)).toBe("Quantity must be greater than 0");
    });

    it("should reject negative numbers", () => {
      expect(validateQuantity(-5)).toBe("Quantity must be greater than 0");
    });

    it("should reject non-integers", () => {
      expect(validateQuantity(1.5)).toBe("Quantity must be a whole number");
    });
  });

  describe("validatePrice", () => {
    it("should accept valid prices", () => {
      expect(validatePrice(0.99)).toBeNull();
      expect(validatePrice(10)).toBeNull();
      expect(validatePrice(9999.99)).toBeNull();
    });

    it("should reject negative prices", () => {
      expect(validatePrice(-10)).toBe("Price cannot be negative");
    });

    it("should reject more than 2 decimal places", () => {
      expect(validatePrice(10.999)).toBe(
        "Price can have at most 2 decimal places",
      );
    });

    it("should allow zero price", () => {
      expect(validatePrice(0)).toBeNull();
    });
  });

  describe("validateRequired", () => {
    it("should accept non-empty values", () => {
      expect(validateRequired("test", "Field")).toBeNull();
      expect(validateRequired(0, "Field")).toBeNull();
      expect(validateRequired(false, "Field")).toBeNull();
    });

    it("should reject empty strings", () => {
      expect(validateRequired("", "Field")).toBe("Field is required");
      expect(validateRequired("   ", "Field")).toBe("Field is required");
    });

    it("should reject null and undefined", () => {
      expect(validateRequired(null, "Field")).toBe("Field is required");
      expect(validateRequired(undefined, "Field")).toBe("Field is required");
    });

    it("should use custom field name", () => {
      expect(validateRequired("", "Customer Name")).toBe(
        "Customer Name is required",
      );
    });
  });

  describe("validateDate", () => {
    it("should accept valid dates", () => {
      expect(validateDate("2024-01-01")).toBeNull();
      expect(validateDate(new Date().toISOString())).toBeNull();
    });

    it("should reject empty date", () => {
      expect(validateDate("")).toBe("Date is required");
    });

    it("should reject invalid date format", () => {
      expect(validateDate("invalid")).toBe("Invalid date format");
      expect(validateDate("32/13/2024")).toBe("Invalid date format");
    });

    it("should reject future dates when maxDate is today", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(
        validateDate(tomorrow.toISOString(), { maxDate: new Date() }),
      ).toBe("Date cannot be in the future");
    });

    it("should reject past dates when minDate is today", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(
        validateDate(yesterday.toISOString(), { minDate: new Date() }),
      ).toBe("Date cannot be in the past");
    });
  });
});
