"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Calculator,
  Calendar,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface LeadCaptureFormProps {
  variant?:
    | "roi-calculator"
    | "demo-request"
    | "resource-download"
    | "newsletter";
  title?: string;
  description?: string;
  leadMagnet?: {
    title: string;
    description: string;
    icon: React.ElementType;
  };
  onSubmit?: (data: any) => void;
}

export function LeadCaptureForm({
  variant = "demo-request",
  title,
  description,
  leadMagnet,
  onSubmit,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    phone: "",
    warehouseSize: "",
    currentSystem: "",
    challenges: "",
    timeline: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        jobTitle: "",
        phone: "",
        warehouseSize: "",
        currentSystem: "",
        challenges: "",
        timeline: "",
        message: "",
      });
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Thank You!</h3>
        <p className="text-muted-foreground">
          {variant === "demo-request" &&
            "We'll contact you within 24 hours to schedule your personalized demo."}
          {variant === "roi-calculator" &&
            "Your ROI report has been sent to your email."}
          {variant === "resource-download" &&
            "Your download link has been sent to your email."}
          {variant === "newsletter" &&
            "You've been added to our newsletter. Welcome to LogiVox!"}
        </p>
      </Card>
    );
  }

  const getFormConfig = () => {
    switch (variant) {
      case "roi-calculator":
        return {
          title: title || "Calculate Your ROI with LogiVox",
          description:
            description ||
            "Get a personalized ROI analysis showing potential savings and implementation timeline.",
          icon: Calculator,
          buttonText: "Calculate My ROI",
          badge: "💰 ROI Calculator",
        };
      case "resource-download":
        return {
          title: title || leadMagnet?.title || "Download Free Resource",
          description:
            description ||
            leadMagnet?.description ||
            "Get instant access to our exclusive resource.",
          icon: leadMagnet?.icon || Download,
          buttonText: "Download Now",
          badge: "📄 Free Download",
        };
      case "newsletter":
        return {
          title: title || "Stay Ahead of the Curve",
          description:
            description ||
            "Get weekly insights on warehouse technology, optimization strategies, and industry trends.",
          icon: Mail,
          buttonText: "Subscribe Now",
          badge: "📧 Newsletter",
        };
      default: // demo-request
        return {
          title: title || "See LogiVox in Action",
          description:
            description ||
            "Schedule a personalized demo and see how LogiVox can transform your warehouse operations.",
          icon: Calendar,
          buttonText: "Request Demo",
          badge: "🚀 Live Demo",
        };
    }
  };

  const config = getFormConfig();

  return (
    <Card className="border-primary/20">
      <CardHeader className="text-center">
        <Badge className="mb-4 w-fit mx-auto">{config.badge}</Badge>
        <config.icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-2xl">{config.title}</CardTitle>
        <CardDescription className="text-base">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Business Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          {(variant === "demo-request" || variant === "roi-calculator") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="warehouseSize">Warehouse Size</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("warehouseSize", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      Small ({`< 50,000`} sq ft)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium (50,000 - 200,000 sq ft)
                    </SelectItem>
                    <SelectItem value="large">
                      Large (200,000 - 500,000 sq ft)
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise ({`> 500,000`} sq ft)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSystem">Current WMS/System</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("currentSystem", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select current system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No WMS (Manual/Excel)</SelectItem>
                    <SelectItem value="sap">SAP WM/EWM</SelectItem>
                    <SelectItem value="oracle">Oracle WMS</SelectItem>
                    <SelectItem value="manhattan">
                      Manhattan Associates
                    </SelectItem>
                    <SelectItem value="fishbowl">Fishbowl</SelectItem>
                    <SelectItem value="netsuite">NetSuite WMS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Implementation Timeline</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("timeline", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When do you need to implement?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">
                      Immediately ({`< 30`} days)
                    </SelectItem>
                    <SelectItem value="quarter">
                      This Quarter ({`< 90`} days)
                    </SelectItem>
                    <SelectItem value="halfyear">Next 6 months</SelectItem>
                    <SelectItem value="year">Within a year</SelectItem>
                    <SelectItem value="research">Just researching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges">Primary Challenge</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("challenges", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What's your biggest warehouse challenge?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">
                      Inventory Accuracy Issues
                    </SelectItem>
                    <SelectItem value="productivity">
                      Low Productivity
                    </SelectItem>
                    <SelectItem value="visibility">
                      Lack of Real-time Visibility
                    </SelectItem>
                    <SelectItem value="labor">Labor Management</SelectItem>
                    <SelectItem value="growth">Scaling Operations</SelectItem>
                    <SelectItem value="compliance">
                      Compliance Requirements
                    </SelectItem>
                    <SelectItem value="costs">
                      Reducing Operating Costs
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {variant === "demo-request" && (
            <div className="space-y-2">
              <Label htmlFor="message">Additional Information (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us more about your warehouse operations and goals..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
              />
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            <config.icon className="h-4 w-4 mr-2" />
            {config.buttonText}
          </Button>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          By submitting this form, you agree to our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          and consent to receive communications from LogiVox.
        </div>
      </CardContent>
    </Card>
  );
}
