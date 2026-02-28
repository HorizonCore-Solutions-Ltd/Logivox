import { Metadata } from "next";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  ArrowRight,
  Users,
  AlertTriangle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "HR & Workforce Integration Guide | LogiVox Documentation",
  description:
    "Connect Workday, SAP SuccessFactors, UKG, ADP, BambooHR, and HiBob with LogiVox to sync workers, shifts, and time-and-attendance data.",
};

export default function HRIntegrationPage() {
  const providers = [
    {
      name: "Workday HCM",
      auth: "OAuth 2.0",
      complexity: "Enterprise",
      emoji: "🏢",
      notes:
        "Workday REST API — Workers, Job Profiles, and Scheduling modules.",
    },
    {
      name: "SAP SuccessFactors",
      auth: "OAuth 2.0 (SAML bearer)",
      complexity: "Enterprise",
      emoji: "🔵",
      notes:
        "OData API v2 — Employee Central, Time & Attendance, and Org Chart.",
    },
    {
      name: "UKG (Kronos)",
      auth: "OAuth 2.0",
      complexity: "High",
      emoji: "⏱️",
      notes: "UKG Pro / Dimensions API — shift schedules and time punches.",
    },
    {
      name: "ADP Workforce Now",
      auth: "OAuth 2.0",
      complexity: "High",
      emoji: "💼",
      notes: "ADP Marketplace API — workers, pay groups, and org codes.",
    },
    {
      name: "BambooHR",
      auth: "API Key",
      complexity: "Low",
      emoji: "🎋",
      notes: "REST API — employee directory, custom fields, and webhooks.",
    },
    {
      name: "HiBob",
      auth: "API Key",
      complexity: "Low",
      emoji: "👥",
      notes:
        "HiBob People API — profiles, org structure, and lifecycle events.",
    },
  ];

  const syncedData = [
    {
      title: "Employee Profiles",
      description: "Worker IDs, names, job titles, departments, and org units",
      direction: "HR → LogiVox",
    },
    {
      title: "Shift Schedules",
      description: "Upcoming shift assignments mapped to warehouse zones",
      direction: "HR → LogiVox",
    },
    {
      title: "Time & Attendance",
      description: "Clock-in/out events and worked hours reconciliation",
      direction: "HR → LogiVox",
    },
    {
      title: "Onboarding / Offboarding",
      description:
        "Automatic access provisioning when workers are created or terminated",
      direction: "HR → LogiVox",
    },
    {
      title: "Skills & Certifications",
      description:
        "Operator competencies used for task routing (picker, forklift, etc.)",
      direction: "HR → LogiVox",
    },
    {
      title: "Org Structure",
      description:
        "Cost centres, teams, and reporting lines for capacity planning",
      direction: "HR → LogiVox",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Enable the HR Connector",
      description:
        "Settings → Integrations → HR & Workforce — select your provider.",
    },
    {
      step: 2,
      title: "Create an API credential in your HRIS",
      description:
        "Generate OAuth client or API key scoped to Employee and Scheduling read access.",
    },
    {
      step: 3,
      title: "Enter credentials in LogiVox",
      description:
        "Paste Client ID/Secret and tenant URL into the HR connector screen.",
    },
    {
      step: 4,
      title: "Map departments to warehouse zones",
      description:
        "Link HR department codes to LogiVox zones for capacity planning.",
    },
    {
      step: 5,
      title: "Configure sync triggers",
      description:
        "Choose real-time webhooks for onboarding/offboarding, scheduled sync for shifts.",
    },
    {
      step: 6,
      title: "Test with a sample employee",
      description:
        "Trigger a manual sync and verify one worker profile appears in LogiVox correctly.",
    },
    {
      step: 7,
      title: "Enable for all workers",
      description:
        "Activate the connector for your full workforce. Review sync health in the dashboard.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-violet-900 via-violet-800 to-violet-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-violet-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-violet-600 flex items-center justify-center">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-violet-700 text-violet-100">
                HR & Workforce
              </Badge>
              <h1 className="text-4xl font-bold">
                HR & Workforce Integration Guide
              </h1>
            </div>
          </div>
          <p className="text-xl text-violet-100 max-w-3xl">
            Sync your workforce data — employees, shifts, and
            time-and-attendance — from your HRIS into LogiVox for intelligent
            task routing and capacity planning.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported HR Providers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {p.complexity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Auth:</span>{" "}
                    {p.auth}
                  </p>
                  <p>{p.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">What Gets Synchronised</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {syncedData.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {item.direction}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Trigger HR Sync
                </CardTitle>
                <CardDescription>POST /api/integrations/hr</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-purple-400">
                    POST{" "}
                    <span className="text-blue-400">/api/integrations/hr</span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">"WORKDAY"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"action"</span>:{" "}
                    <span className="text-yellow-300">"sync"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"scope"</span>:{" "}
                    <span className="text-yellow-300">"workers,shifts"</span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="container-enterprise max-w-3xl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Privacy</AlertTitle>
            <AlertDescription>
              HR data is sensitive. LogiVox syncs only operational fields
              (employee ID, name, department, shifts). Payroll, salary, and
              personal details are never ingested. Review your DPA before
              enabling.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="py-14 bg-gradient-to-br from-violet-600 to-violet-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to sync your workforce?
          </h2>
          <p className="text-violet-100 mb-6">
            Connect your HRIS and unlock intelligent task routing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Talk to an Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
