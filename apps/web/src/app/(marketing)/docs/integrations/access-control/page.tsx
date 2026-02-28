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
import {
  Shield,
  CheckCircle2,
  Key,
  DoorOpen,
  Users,
  Bell,
  Settings,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Access Control Integration Guide | LogiVox",
  description:
    "Sync physical access control systems (PACS) with LogiVox. Support for Paxton, Gallagher, HID, and LenelS2.",
};

export default function AccessControlPage() {
  const integrationSteps = [
    { step: 1, title: "Install Agent", description: "Deploy the LogiVox PACS Agent on your access control server" },
    { step: 2, title: "Configure API", description: "Enter API credentials for your access control system" },
    { step: 3, title: "Map Zones", description: "Link physical access zones to LogiVox warehouse areas" },
    { step: 4, title: "Sync Users", description: "Import cardholders and link them to LogiVox user accounts" },
    { step: 5, title: "Configure Rules", description: "Set up access rules based on shift status or certification" },
  ];

  const syncedData = [
    { title: "Cardholders", description: "Sync employees and contractors", frequency: "Real-time" },
    { title: "Credentials", description: "Badge numbers and mobile IDs", frequency: "Real-time" },
    { title: "Access Events", description: "Entry/exit logs for attendance", frequency: "Real-time" },
    { title: "Door Status", description: "Monitor door forced/held open alarms", frequency: "Real-time" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border-b py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <Link href="/platform/integrations" className="hover:text-white">Integrations</Link>
            <span>/</span>
            <span>Access Control</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Physical Access Control</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Unify physical and digital security. Automatically revoke warehouse access when shifts end or certifications expire.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Unified Security</h2>
              <p className="text-lg text-slate-600 mb-6">
                Bridge the gap between HR, WMS, and Physical Security. tailored for high-security environments like bonded warehouses and pharma storage.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-red-100 rounded-lg"><Key className="w-6 h-6 text-red-600" /></div>
                   <div><h3 className="font-semibold text-lg">Automated Provisioning</h3><p className="text-slate-600">Grant badge access only when an employee is rostered on shift.</p></div>
                </div>
                 <div className="flex items-start gap-4">
                   <div className="p-2 bg-orange-100 rounded-lg"><Bell className="w-6 h-6 text-orange-600" /></div>
                   <div><h3 className="font-semibold text-lg">Security Alerts</h3><p className="text-slate-600">Trigger WMS alerts if a door is forced open in a high-value cage.</p></div>
                </div>
              </div>
            </div>
             <div className="bg-slate-50 p-8 rounded-xl border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">Supported Systems</h3>
              <div className="grid grid-cols-2 gap-4">
                {["Paxton Net2", "Gallagher", "HID Origo", "LenelS2", "Brivo", "Genetec"].map(p => (
                   <div key={p} className="flex items-center gap-2 p-3 bg-white rounded-lg border shadow-sm"><CheckCircle2 className="w-4 h-4 text-green-500"/><span className="text-sm font-medium">{p}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y">
        <div className="container-enterprise">
          <h2 className="text-3xl font-bold mb-12 text-center">Setup Process</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {integrationSteps.map((step) => (
              <Card key={step.step} className="relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-sm">{step.step}</div>
                <CardHeader><CardTitle className="text-lg">{step.title}</CardTitle></CardHeader>
                <CardContent><CardDescription>{step.description}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
