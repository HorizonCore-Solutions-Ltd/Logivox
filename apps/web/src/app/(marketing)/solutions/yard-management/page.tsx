"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Package,
  Timer,
  MapPin,
  AlertCircle,
  Shield,
  LayoutGrid,
  Navigation,
  GitMerge,
  Bell,
} from "lucide-react";

export default function YardManagementPage() {
  const capabilities = [
    {
      icon: Shield,
      title: "Automated Gate Check-In",
      description:
        "Drivers check in and clear security in under 60 seconds. LogiVox captures vehicle number, license plate, trailer number, carrier, and auto-links to the matching dock appointment — no manual lookup required.",
      badge: "Live",
    },
    {
      icon: LayoutGrid,
      title: "Real-Time Yard Map",
      description:
        "A live visual grid of every dock door, parking spot, and staging area — colour-coded by status. See carrier name, trailer number, and appointment type at a glance for every occupied position.",
      badge: "Live",
    },
    {
      icon: Navigation,
      title: "Shunter Dispatch & Task Management",
      description:
        "Automatically generate PULL_TO_DOCK tasks for checked-in trailers within the next hour and SPOT_TRAILER tasks for completed loads needing to clear the dock. Assign to yard drivers in one click.",
      badge: "Live",
    },
    {
      icon: Calendar,
      title: "Smart Dock Scheduling",
      description:
        "Appointment-based scheduling prevents dock congestion. Configurable time slots, buffer periods, and appointment types (inbound, outbound, cross-dock) with carrier self-check-in support.",
      badge: "Live",
    },
    {
      icon: Timer,
      title: "Detention Fee Prevention",
      description:
        "Live dwell time tracking flags trucks approaching their contracted window. Urgent shunter tasks auto-escalate with a countdown timer before detention clocks expire. Average customers eliminate 95% of detention charges.",
      badge: "Live",
    },
    {
      icon: GitMerge,
      title: "Appointment Auto-Linking",
      description:
        "When a vehicle checks in, LogiVox automatically locates the matching dock appointment by vehicle number and updates its status to CHECKED_IN — removing manual reconciliation entirely.",
      badge: "Live",
    },
    {
      icon: Bell,
      title: "Security Screening Workflow",
      description:
        "Gate log records security pass/fail for every vehicle entry with security notes and inspector ID. Full audit trail filterable by direction, carrier, appointment type, or date.",
      badge: "Live",
    },
    {
      icon: AlertCircle,
      title: "Urgent Task Escalation",
      description:
        "URGENT shunter tasks surface with a red badge and countdown timer showing minutes until dock appointment. Supervisors see a live count of pending vs urgent tasks in the KPI header.",
      badge: "Live",
    },
  ];

  const metrics = [
    {
      number: "65%",
      label: "Reduction in Truck Wait Times",
      description:
        "Pre-scheduled appointments eliminate unscheduled arrivals and yard queuing",
    },
    {
      number: "40%",
      label: "More Daily Dock Throughput",
      description:
        "Optimised shunter dispatch and appointment sequencing fills every dock slot",
    },
    {
      number: "95%",
      label: "Detention Fee Elimination",
      description:
        "Proactive dwell-time alerts fire before detention clocks expire",
    },
    {
      number: "< 60s",
      label: "Avg Gate Check-In Time",
      description:
        "Auto-linked appointments and digital gate log replace clipboard check-in",
    },
    {
      number: "100%",
      label: "Yard Visibility",
      description:
        "Live yard map accounts for every dock door, parking spot, and staging bay",
    },
    {
      number: "Zero",
      label: "Manual Shunter Radio Calls",
      description:
        "All dispatch handled digitally — tasks appear on driver mobile in real-time",
    },
  ];

  const comparisonRows = [
    {
      capability: "Live yard map (dock + parking + staging)",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Automated gate log with appointment auto-linking",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Security check recording per vehicle",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Shunter task auto-generation (PULL_TO_DOCK / SPOT_TRAILER)",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Detention fee countdown timer per task",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Urgent task escalation with visual badge",
      logivox: true,
      legacy: false,
    },
    { capability: "Dock appointment scheduling", logivox: true, legacy: true },
    { capability: "Carrier check-in workflow", logivox: true, legacy: true },
    {
      capability: "Real-time UI (15s auto-refresh)",
      logivox: true,
      legacy: false,
    },
    {
      capability: "Integrated with WMS inventory & GRN",
      logivox: true,
      legacy: false,
    },
  ];

  const useCases = [
    {
      title: "High-Volume Distribution Centre",
      scenario: "150+ truck movements per day across 24 dock doors",
      challenge:
        "Shunters were dispatched by radio. No one knew which trailers were ready to move. Detention costs were $40K/month.",
      outcome:
        "Task auto-generation eliminated radio dispatching. Detention costs dropped to <$2K/month in the first quarter.",
    },
    {
      title: "3PL Facility (Multi-Tenant Yard)",
      scenario: "Multiple customers sharing the same yard, tracked separately",
      challenge:
        "Gate staff manually matched paperwork to appointments. Mismatches caused security holds and delays.",
      outcome:
        "Automated appointment linking eliminated mismatches. Gate check-in time dropped from 8 minutes to 45 seconds.",
    },
    {
      title: "Retail DC — Peak Season",
      scenario: "350% volume surge during peak, same yard capacity",
      challenge:
        "Trailers were parked without records. Shunters couldn't locate trailers needed for dock pull. OTD suffered.",
      outcome:
        "Yard map gave supervisors instant trailer location visibility. OTD maintained at 98.5% through peak.",
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: "Smart Dock Scheduling",
      description:
        "Advanced appointment system prevents congestion and optimizes dock door utilization for inbound and outbound operations.",
    },
    {
      icon: Clock,
      title: "Time Slot Management",
      description:
        "Flexible scheduling with configurable time slots, buffer periods, and appointment types (inbound, outbound, cross-dock).",
    },
    {
      icon: Truck,
      title: "Carrier Coordination",
      description:
        "Seamless carrier check-in process with appointment verification and automatic dock assignment upon arrival.",
    },
    {
      icon: MapPin,
      title: "Dock Door Management",
      description:
        "Track dock door availability, capacity, and real-time status across all loading and unloading positions.",
    },
    {
      icon: Timer,
      title: "Dwell Time Monitoring",
      description:
        "Monitor truck turnaround times with automated alerts when vehicles exceed scheduled duration.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Live dashboard showing current dock status, upcoming appointments, and loading/unloading progress.",
    },
  ];

  const benefits = [
    {
      metric: "65%",
      label: "Reduction in Wait Times",
      description:
        "Trucks arrive at pre-scheduled times, eliminating congestion",
    },
    {
      metric: "40%",
      label: "More Throughput",
      description: "Optimized scheduling increases daily shipments processed",
    },
    {
      metric: "85%",
      label: "On-Time Arrivals",
      description: "Carrier coordination improves punctuality and planning",
    },
    {
      metric: "30%",
      label: "Labor Efficiency",
      description: "Receiving teams prepared for scheduled arrivals",
    },
  ];

  const workflow = [
    {
      step: "1. Book Appointment",
      description: "Carrier schedules dock appointment online or via API",
      icon: Calendar,
    },
    {
      step: "2. Arrival Notification",
      description: "Driver checks in at gate, system verifies appointment",
      icon: AlertCircle,
    },
    {
      step: "3. Dock Assignment",
      description:
        "System assigns optimal dock door based on cargo and schedule",
      icon: MapPin,
    },
    {
      step: "4. Loading/Unloading",
      description: "Warehouse team completes operations with progress tracking",
      icon: Package,
    },
    {
      step: "5. Departure",
      description: "Driver checks out, appointment automatically closed",
      icon: CheckCircle2,
    },
  ];

  const appointmentTypes = [
    {
      title: "Inbound Receiving",
      description: "Schedule deliveries from suppliers and carriers",
      features: [
        "ASN/PO matching",
        "Expected delivery time windows",
        "Carrier performance tracking",
        "Receiving team notifications",
      ],
    },
    {
      title: "Outbound Shipping",
      description: "Coordinate customer deliveries and transfers",
      features: [
        "Sales order fulfillment",
        "Loading sequence optimization",
        "Shipping label integration",
        "Carrier pickup scheduling",
      ],
    },
    {
      title: "Cross-Dock Operations",
      description: "Direct transfer without warehouse storage",
      features: [
        "Inbound-to-outbound matching",
        "Real-time shipment coordination",
        "Minimal handling workflows",
        "Fast turnaround optimization",
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-blue-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              className="mb-4 bg-blue-100 text-blue-800 border-blue-300"
              variant="outline"
            >
              Integrated Yard Management · Enterprise WMS
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Gate to Dock in <span className="text-blue-600">Real-Time</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              LogiVox Yard Management closes the gap between your TMS and WMS.
              Live yard map, automated gate check-in, AI-assisted shunter
              dispatch — every trailer accounts for itself from arrival to
              departure.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Book a Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">See Enterprise Pricing</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No detention fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Zero radio dispatching
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Live for Enterprise customers today
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 border-b bg-muted/30">
        <div className="container-enterprise">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{m.number}</p>
                <p className="text-sm font-semibold mt-1">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              What&apos;s Included
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every Yard Management Capability, Out of the Box
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              No add-ons, no integrations to maintain. Yard Management is built
              into the LogiVox platform and shares the same inventory,
              appointment, and carrier data as your WMS.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap, i) => (
              <Card key={i} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <cap.icon className="h-5 w-5 text-blue-700" />
                    </div>
                    <Badge
                      className="bg-green-100 text-green-800 border-green-300 text-xs"
                      variant="outline"
                    >
                      {cap.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{cap.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {cap.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The Yard Lifecycle, Automated
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Carrier Arrives at Gate",
                body: "Driver presents at gate. LogiVox captures vehicle/trailer number, driver name, carrier, and direction. Security inspection recorded. Auto-linked to matching dock appointment.",
              },
              {
                step: "2",
                title: "Trailer Appears on Yard Map",
                body: "The trailer's parking spot lights up on the live yard map immediately after check-in. Supervisors see carrier, appointment type, and spot number in real-time.",
              },
              {
                step: "3",
                title: "Shunter Task Auto-Generated",
                body: "When the appointment window approaches, LogiVox creates a PULL_TO_DOCK task. If urgency threshold is crossed, the task turns red with a countdown timer.",
              },
              {
                step: "4",
                title: "Dock Done — Spot or Release",
                body: "After unload/load, a SPOT_TRAILER task sends the trailer back to parking or releases it to the gate. Yard map updates instantly. Appointment closes.",
              },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 border-t">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              Comparison
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              LogiVox vs. Legacy YMS Solutions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most YMS systems bolt on to your WMS and cost $200K+ to integrate.
              LogiVox Yard Management is native.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Capability
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-blue-700">
                      LogiVox
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-500">
                      Legacy YMS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-muted/40"}
                    >
                      <td className="px-4 py-3">{row.capability}</td>
                      <td className="px-4 py-3 text-center">
                        {row.logivox ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.legacy ? (
                          <CheckCircle2 className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-red-400 text-xs font-medium">
                            ✗ Not included
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              Customer Outcomes
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real-World Impact
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <Card key={i} className="border-blue-200">
                <CardHeader>
                  <Badge
                    className="w-fit mb-2 bg-blue-100 text-blue-800 border-blue-200"
                    variant="outline"
                  >
                    {uc.title}
                  </Badge>
                  <CardDescription className="text-xs">
                    {uc.scenario}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                      Challenge
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {uc.challenge}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                      Outcome
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {uc.outcome}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Connections */}
      <section className="py-20 border-t">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              Platform
            </Badge>
            <h2 className="text-3xl font-bold">
              Yard Management Connects to the Whole Platform
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Gate check-ins update dock appointments instantly. Shunter
              dispatch pulls from WMS receiving schedules. Yard data feeds
              analytics. Nothing is siloed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              {
                label: "Dock & Receiving",
                href: "/solutions/warehouse-management",
                icon: Package,
              },
              {
                label: "Labor Management",
                href: "/solutions/labor-management",
                icon: Zap,
              },
              {
                label: "Robotics & AMR Fleet",
                href: "/solutions/warehouse-management",
                icon: GitMerge,
              },
              {
                label: "IoT Sensor Network",
                href: "/platform/integrations",
                icon: Truck,
              },
            ].map((m, i) => (
              <Link key={i} href={m.href}>
                <Card className="text-center hover:border-blue-400 hover:shadow-md transition-all">
                  <CardContent className="pt-6 pb-4">
                    <m.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">{m.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 bg-blue-600 text-white">
        <div className="container-enterprise">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Stop Paying Detention Fees. Start Today.
            </h2>
            <p className="mt-4 text-blue-100 text-lg">
              LogiVox Yard Management is included in the Enterprise plan. Go
              live in under two weeks with our guided onboarding team.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50"
                asChild
              >
                <Link href="/contact">
                  Schedule a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/pricing">View Enterprise Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
