import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, ArrowRight, ClipboardCheck, AlertTriangle, Code, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "QMS Integration Guide | LogiVox Documentation",
  description:
    "Connect iAuditor, EcoOnline, MasterControl, ETQ Reliance, and Veeva Vault with LogiVox WMS. Sync CAPA actions, audit findings, deviations, and nonconformances.",
};

export default function QMSIntegrationPage() {
  const providers = [
    { name: "iAuditor (SafetyCulture)", auth: "API Key", complexity: "Low", emoji: "✅", notes: "Mobile-first inspection platform — push CAPA actions and audit findings from warehouse inspections." },
    { name: "EcoOnline (EHS)", auth: "OAuth 2.0", complexity: "Medium", emoji: "🟢", notes: "Environmental Health & Safety management — sync chemical COSHH records and safety incidents." },
    { name: "MasterControl", auth: "OAuth 2.0", complexity: "High", emoji: "📋", notes: "ISO-compliant QMS — push nonconformances, CAPAs, and change control records." },
    { name: "ETQ Reliance", auth: "OAuth 2.0", complexity: "High", emoji: "🔵", notes: "Enterprise QMS — audit management, CAPA, and deviation handling for regulated industries." },
    { name: "Veeva Vault QMS", auth: "OAuth 2.0", complexity: "Enterprise", emoji: "🏥", notes: "Life science QMS — deviation, CAPA, and change control sync for pharma and medical device manufacturing." },
  ];

  const syncedData = [
    { title: "CAPA Actions", description: "Corrective and Preventive Actions triggered by warehouse quality events", direction: "LogiVox → QMS" },
    { title: "Audit Findings", description: "Internal/external audit observations linked to specific locations or processes", direction: "LogiVox → QMS" },
    { title: "Deviations", description: "Process deviations recorded during receiving, picking, or dispatch operations", direction: "LogiVox → QMS" },
    { title: "Nonconformances", description: "Product quality issues detected during warehouse QC inspections", direction: "LogiVox → QMS" },
    { title: "Training Records", description: "Operator certifications and training completion status", direction: "QMS → LogiVox" },
    { title: "Document Control", description: "SOPs and work instructions versioning and change notifications", direction: "QMS → LogiVox" },
  ];

  const steps = [
    { step: 1, title: "Enable the QMS Connector", description: "In LogiVox → Settings → Integrations → Quality Management, select your QMS provider." },
    { step: 2, title: "Generate API credentials in your QMS", description: "Create an integration user with permissions for CAPA, Audits, and Deviation modules." },
    { step: 3, title: "Configure webhook endpoints", description: "Set up webhooks in your QMS to notify LogiVox of new training requirements or document changes." },
    { step: 4, title: "Map quality event types", description: "Define which warehouse events trigger CAPA actions (e.g., inventory discrepancy > 5%, damaged goods receipt)." },
    { step: 5, title: "Link warehouse zones to audit scopes", description: "Map LogiVox zones and processes to QMS audit scopes and areas." },
    { step: 6, title: "Test with a sample deviation", description: "Create a test deviation in LogiVox (e.g., temperature excursion) and verify it appears in your QMS." },
    { step: 7, title: "Enable production mode", description: "Activate the connector for live quality event streaming." },
  ];

  const useCases = [
    {
      title: "Temperature Excursions",
      description: "Automatically create CAPA actions in your QMS when cold chain temperature thresholds are breached in the warehouse.",
      icon: AlertTriangle,
    },
    {
      title: "Inventory Discrepancies",
      description: "Trigger deviation reports when cycle count variance exceeds configured tolerance levels.",
      icon: ClipboardCheck,
    },
    {
      title: "Audit Trails",
      description: "Push complete audit trails for pick/pack/ship operations to support regulatory inspections.",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-lime-900 via-lime-800 to-lime-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/docs/integrations" className="text-lime-300 hover:text-white text-sm">
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-lime-600 flex items-center justify-center">
              <ClipboardCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-lime-700 text-lime-100">Quality Management</Badge>
              <h1 className="text-4xl font-bold">QMS Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-lime-100 max-w-3xl">
            Connect your Quality Management System to LogiVox for automated CAPA actions, audit findings, and regulatory compliance tracking.
          </p>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported QMS Providers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{p.complexity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Auth:</span> {p.auth}</p>
                  <p>{p.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Gets Synced */}
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
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{item.direction}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Common Use Cases</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <Card key={uc.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-lime-100 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-lime-600" />
                    </div>
                    <CardTitle className="text-lg">{uc.title}</CardTitle>
                    <CardDescription>{uc.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-lime-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Snippet */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Trigger Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code className="h-4 w-4" /> Trigger QMS Sync</CardTitle>
                <CardDescription>POST /api/integrations/qms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">{"// Create a CAPA action from a warehouse event"}</div>
                  <div className="mt-2"><span className="text-purple-400">POST</span> <span className="text-blue-400">/api/integrations/qms</span></div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4"><span className="text-blue-300">"provider"</span>: <span className="text-yellow-300">"IAUDITOR"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"action"</span>: <span className="text-yellow-300">"create_capa"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"event_type"</span>: <span className="text-yellow-300">"temperature_excursion"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"zone_id"</span>: <span className="text-yellow-300">"COLD-ZONE-A"</span></div>
                  <div className="text-slate-400">{"}"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Alert */}
      <section className="py-10 bg-muted/30">
        <div className="container-enterprise max-w-3xl">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Regulatory Compliance</AlertTitle>
            <AlertDescription>
              QMS integrations for life science and medical device manufacturing require validation and audit trail documentation. Contact your LogiVox compliance team for IQ/OQ/PQ support.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-lime-600 to-lime-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to connect your QMS?</h2>
          <p className="text-lime-100 mb-6">Automate quality management across your warehouse operations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">Start Free Trial<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" asChild>
              <Link href="/contact">Talk to Quality Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
