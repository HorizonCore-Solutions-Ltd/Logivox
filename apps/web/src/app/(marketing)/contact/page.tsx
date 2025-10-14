"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send, MessageSquare, HelpCircle } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log("Form submitted:", formData)
    alert("Thank you for contacting us! We'll get back to you within 24 hours.")
    
    setFormData({
      name: "",
      email: "",
      company: "",
      phone: "",
      subject: "",
      message: ""
    })
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Our team typically responds within 24 hours",
      value: "hello@flowstock.com",
      action: "mailto:hello@flowstock.com"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Mon-Fri from 8am to 6pm PST",
      value: "+1 (555) 123-4567",
      action: "tel:+15551234567"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our headquarters in San Francisco",
      value: "123 Market Street, San Francisco, CA 94103",
      action: null
    }
  ]

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "Sales Inquiry",
      description: "Learn about pricing and plans"
    },
    {
      icon: HelpCircle,
      title: "Technical Support",
      description: "Get help with your account"
    },
    {
      icon: Send,
      title: "General Question",
      description: "Any other questions"
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary">Contact Us</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions? We're here to help. Reach out to our team and 
              we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method) => (
              <Card key={method.title} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {method.action ? (
                    <a 
                      href={method.action}
                      className="text-primary hover:underline font-medium"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{method.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Send us a Message</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
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
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
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
                    placeholder="Tell us how we can help..."
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
              </form>
            </div>

            {/* Support Options */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">How Can We Help?</h2>
                <p className="text-muted-foreground">
                  Choose the option that best describes your inquiry for faster assistance.
                </p>
              </div>

              <div className="space-y-4">
                {supportOptions.map((option) => (
                  <Card key={option.title}>
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <option.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{option.title}</CardTitle>
                          <CardDescription>{option.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle>Need Immediate Assistance?</CardTitle>
                  <CardDescription>
                    For urgent technical issues, our support team is available 24/7.
                  </CardDescription>
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:support@flowstock.com">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Support
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-16">
        <div className="container-enterprise">
          <Card className="overflow-hidden">
            <div className="bg-muted h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  Interactive map would be integrated here
                </p>
                <p className="text-sm text-muted-foreground">
                  123 Market Street, San Francisco, CA 94103
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
