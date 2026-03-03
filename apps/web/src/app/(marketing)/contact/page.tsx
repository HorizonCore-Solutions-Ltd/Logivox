"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  HelpCircle,
  Clock,
  Zap,
  CheckCircle2,
  Globe,
  HeadphonesIcon,
  AlertCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [showLiveChat, setShowLiveChat] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send message");
      }

      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const supportChannels = [
    {
      icon: Mail,
      title: "Email Support",
      description: "General inquiries and non-urgent issues",
      value: "support@logivox.ai",
      sla: "Response within 24 hours",
      action: "mailto:support@logivox.ai",
      hours: "24/7",
    },
    {
      icon: Phone,
      title: "Sales Team",
      description: "Pricing, demos, and partnership inquiries",
      value: "sales@logivox.ai",
      sla: "Response within 2 hours (business hours)",
      action: "mailto:sales@logivox.ai",
      hours: "Mon-Fri, 8am-6pm PST",
    },
    {
      icon: HeadphonesIcon,
      title: "Premium Support",
      description: "Enterprise customers - priority support",
      value: "+1 (555) SUPPORT-1",
      sla: "Response within 30 minutes",
      action: "tel:+15555878677",
      hours: "24/7 Available",
    },
  ];

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "Sales Inquiry",
      description: "Pricing, plans, features, demos",
      channel: "sales@logivox.ai",
      sla: "2 hours",
    },
    {
      icon: AlertCircle,
      title: "Technical Support",
      description: "Account issues, troubleshooting, bugs",
      channel: "support@logivox.ai",
      sla: "24 hours",
    },
    {
      icon: Zap,
      title: "Implementation",
      description: "Onboarding, training, data migration",
      channel: "sales@logivox.ai",
      sla: "4 hours",
    },
    {
      icon: Globe,
      title: "Partnership",
      description: "Reseller, integration, affiliate opportunities",
      channel: "partnerships@logivox.ai",
      sla: "48 hours",
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "support@logivox.ai",
      action: "mailto:support@logivox.ai",
    },
    {
      icon: Phone,
      title: "Sales Phone",
      value: "+1 (555) 123-4567",
      action: "tel:+15551234567",
    },
    {
      icon: MapPin,
      title: "Headquarters",
      value: "San Francisco, CA",
      action: null,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary">Contact Us</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              We're Here to Help
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Multiple ways to reach our team. Choose the channel that works
              best for you. Average response time: less than 2 hours during
              business hours.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Support Channels */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Direct Support Channels</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred way to contact us. All channels are actively
              monitored.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportChannels.map((channel) => (
              <Card
                key={channel.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <channel.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {channel.hours}
                    </Badge>
                  </div>
                  <CardTitle>{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Response Time
                    </p>
                    <p className="text-sm font-semibold">{channel.sla}</p>
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <a href={channel.action}>{channel.value}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support by Type */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              What Do You Need Help With?
            </h2>
            <p className="text-muted-foreground">
              Select your inquiry type to be routed to the right team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportOptions.map((option) => (
              <Card
                key={option.title}
                className="hover:border-primary transition-colors cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <option.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {option.title}
                        </CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {option.sla} SLA
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`mailto:${option.channel}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {option.channel}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24">
        <div className="container-enterprise">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Send Us a Message</h2>
                <p className="text-muted-foreground">
                  Fill out the form and we'll get back to you as soon as
                  possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-field">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-field">
                    <label htmlFor="company" className="form-label">
                      Company
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Your Company"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="subject" className="form-label">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select a subject</option>
                    <option value="sales">
                      Sales Inquiry - Pricing & Demo
                    </option>
                    <option value="support">
                      Technical Support - Account Help
                    </option>
                    <option value="implementation">
                      Implementation & Onboarding
                    </option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="message" className="form-label">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="form-input resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>

                {submitSuccess && (
                  <div className="flex items-start gap-3 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium">Message sent!</p>
                      <p className="text-sm mt-0.5">
                        Thank you for contacting us. We&apos;ll get back to you
                        within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="flex items-start gap-3 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                    <p className="text-sm">{submitError}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-2 border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/features">Explore Features</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/help">Visit Help Center</Link>
                  </Button>
                  <Button asChild className="w-full justify-start">
                    <Link href="/pricing">Schedule Demo</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Sales Team</p>
                    <p className="text-sm text-muted-foreground">
                      Mon-Fri, 8am-6pm PST
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Technical Support</p>
                    <p className="text-sm text-muted-foreground">
                      24/7 Available
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      All times in Pacific Standard Time (PST)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Response Times */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Sales Inquiry</span>
                    <Badge variant="secondary">2 hours</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Support Ticket</span>
                    <Badge variant="secondary">24 hours</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Premium (SLA)</span>
                    <Badge variant="secondary">30 min</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Can't find what you're looking for?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Check our help center for common questions, documentation, and
            troubleshooting guides.
          </p>
          <Button size="lg" asChild>
            <Link href="/help">Visit Help Center</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
