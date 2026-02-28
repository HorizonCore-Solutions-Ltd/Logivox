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
  Mic,
  CheckCircle2,
  ArrowRight,
  Headphones,
  AlertTriangle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Voice Hardware Integration Guide | LogiVox Documentation",
  description:
    "Connect Honeywell Vocollect, Lydia Voice, and Android headsets to LogiVox. Hands-free voice-directed picking for warehouse operations.",
};

export default function VoiceHardwareIntegrationPage() {
  const providers = [
    {
      name: "Honeywell Vocollect",
      type: "Enterprise Voice",
      auth: "REST API",
      complexity: "High",
      emoji: "🎧",
      notes:
        "Vocollect SRX headsets with voice profiles, operator training, and real-time task dispatch.",
    },
    {
      name: "Lydia Voice",
      type: "Cloud Voice",
      auth: "REST API",
      complexity: "High",
      emoji: "🎤",
      notes:
        "Lydia cloud platform for voice-directed workflows — multi-language, accent adaptation.",
    },
    {
      name: "Android Voice (BYOD)",
      type: "TTS/STT",
      auth: "REST API",
      complexity: "Medium",
      emoji: "📱",
      notes:
        "Generic Android devices with Bluetooth headsets — text-to-speech and speech-to-text APIs.",
    },
    {
      name: "Zebra Voice",
      type: "Mobile Voice",
      auth: "REST API",
      complexity: "Medium",
      emoji: "🦓",
      notes:
        "Zebra TC-series mobile computers with native voice client and Bluetooth audio.",
    },
  ];

  const syncedData = [
    {
      title: "Pick Tasks",
      description:
        "Push pick assignments to voice client — aisle, bin, SKU, quantity",
      direction: "LogiVox → Voice",
    },
    {
      title: "Pick Confirmations",
      description: "Operator speaks quantity, system confirms and updates WMS",
      direction: "Voice → LogiVox",
    },
    {
      title: "Operator Profiles",
      description:
        "Sync voice training data, language preferences, and audio settings",
      direction: "Bidirectional",
    },
    {
      title: "Workflow Dialogue",
      description:
        "Define voice prompt sequences (Zone → Bin → Check Digit → Quantity)",
      direction: "LogiVox → Voice",
    },
    {
      title: "Exception Handling",
      description:
        "Short pick, damage, wrong location — voice escalation to supervisor",
      direction: "Voice → LogiVox",
    },
    {
      title: "Performance Metrics",
      description: "Picks per hour, error rate, voice recognition accuracy",
      direction: "Voice → LogiVox",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Enable Voice Connector",
      description:
        "In LogiVox → Settings → Integrations → Voice Hardware, select your provider (Vocollect, Lydia, Android).",
    },
    {
      step: 2,
      title: "Obtain Voice API Credentials",
      description:
        "Get REST API endpoint and key from your voice platform provider or deploy LogiVox Voice Server.",
    },
    {
      step: 3,
      title: "Deploy Voice Client",
      description:
        "Install voice client app on Android devices or configure Vocollect SRX headsets with server endpoint.",
    },
    {
      step: 4,
      title: "Train Operator Voice Profiles",
      description:
        "Each operator completes voice training session (20-30 words) to build speech model.",
    },
    {
      step: 5,
      title: "Configure Workflow Dialogue",
      description:
        "Define voice prompts for pick flow: Zone → Aisle → Bin → Check Digit → Quantity → Confirmation.",
    },
    {
      step: 6,
      title: "Test Pick Task",
      description:
        "Create a test pick wave, dispatch to voice operator, verify all prompts and confirmations work.",
    },
    {
      step: 7,
      title: "Enable Production Mode",
      description:
        "Activate live voice picking. Monitor accuracy and error rates in Voice Performance Dashboard.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-pink-900 via-fuchsia-800 to-pink-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-pink-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-pink-600 flex items-center justify-center">
              <Mic className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-pink-700 text-pink-100">
                Voice-Directed Picking
              </Badge>
              <h1 className="text-4xl font-bold">
                Voice Hardware Integration Guide
              </h1>
            </div>
          </div>
          <p className="text-xl text-pink-100 max-w-3xl">
            Hands-free, eyes-free warehouse operations. Integrate enterprise
            voice hardware for 99.9% picking accuracy and 40% productivity
            gains.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported Voice Hardware</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <Badge variant="secondary" className="text-xs w-fit">
                    {p.type}
                  </Badge>
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
          <h2 className="text-2xl font-bold mb-6">Voice Workflow Data</h2>
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
                <div className="h-8 w-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
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
          <h2 className="text-2xl font-bold mb-6">API Integration Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Dispatch Pick Task to Voice
                  Client
                </CardTitle>
                <CardDescription>
                  POST /api/integrations/voice-hardware
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Push pick task to voice operator"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">
                      /api/integrations/voice-hardware
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">
                      "HONEYWELL_VOCOLLECT"
                    </span>
                    ,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"operatorId"</span>:{" "}
                    <span className="text-yellow-300">"OP-12345"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"tasks"</span>: [
                  </div>
                  <div className="ml-8">{"{"}</div>
                  <div className="ml-12">
                    <span className="text-blue-300">"zone"</span>:{" "}
                    <span className="text-yellow-300">"A"</span>,
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-300">"aisle"</span>:{" "}
                    <span className="text-yellow-300">"12"</span>,
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-300">"bin"</span>:{" "}
                    <span className="text-yellow-300">"03"</span>,
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-300">"checkDigit"</span>:{" "}
                    <span className="text-yellow-300">"47"</span>,
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-300">"sku"</span>:{" "}
                    <span className="text-yellow-300">"WIDGET-001"</span>,
                  </div>
                  <div className="ml-12">
                    <span className="text-blue-300">"quantity"</span>:{" "}
                    <span className="text-yellow-300">5</span>
                  </div>
                  <div className="ml-8">{"}"}</div>
                  <div className="ml-4">{"]"}</div>
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
            <AlertTitle>Hardware Required</AlertTitle>
            <AlertDescription>
              Voice picking requires compatible hardware (Vocollect headsets,
              Android devices with Bluetooth audio, or Zebra voice-enabled
              mobile computers). Contact your LogiVox account team for device
              recommendations and procurement support.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="py-14 bg-gradient-to-br from-pink-600 to-fuchsia-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to enable voice picking?
          </h2>
          <p className="text-pink-100 mb-6">
            Boost accuracy and productivity with hands-free operations.
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
