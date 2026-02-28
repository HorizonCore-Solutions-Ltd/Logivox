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
  Lock,
  CheckCircle2,
  Shield,
  Key,
  Users,
  Settings,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SSO & Identity Integration Guide | LogiVox Documentation",
  description:
    "Configure Single Sign-On (SSO) and identity management with LogiVox. Support for Okta, Azure AD, and Google Workspace.",
};

export default function SSOIntegrationPage() {
  const integrationSteps = [
    {
      step: 1,
      title: "Choose Provider",
      description: "Select your Identity Provider (IdP) in LogiVox Admin",
    },
    {
      step: 2,
      title: "Configure Metadata",
      description: "Exchange SAML/OIDC metadata between LogiVox and IdP",
    },
    {
      step: 3,
      title: "Map Attributes",
      description: "Map user attributes (email, name, role) to LogiVox fields",
    },
    {
      step: 4,
      title: "Test Connection",
      description: "Verify login flow with a test user account",
    },
    {
      step: 5,
      title: "Enforce SSO",
      description: "Enable SSO enforcement for all or specific users",
    },
  ];

  const syncedData = [
    {
      title: "Users",
      description: "Provision and deprovision users automatically",
      frequency: "Real-time (SCIM)",
    },
    {
      title: "Groups",
      description: "Sync security groups to LogiVox teams",
      frequency: "Real-time (SCIM)",
    },
    {
      title: "Roles",
      description: "Map IdP groups to LogiVox permissions",
      frequency: "On login / Update",
    },
    {
      title: "Authentication",
      description: "Centralized login validation",
      frequency: "Every session",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border-b py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <Link href="/docs/api" className="hover:text-white">
              API Docs
            </Link>
            <span>/</span>
            <Link href="/platform/integrations" className="hover:text-white">
              Integrations
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4">SSO & Identity Integration</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Secure your warehouse operations with enterprise-grade Single Sign-On.
            LogiVox supports SAML 2.0 and OIDC for seamless authentication.
          </p>
          <div className="flex gap-4 mt-8">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/contact">Configure SSO</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-slate-600 hover:bg-slate-700 text-white" asChild>
              <Link href="/docs/api/getting-started">View API Specs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Centralized Access Control</h2>
              <p className="text-lg text-slate-600 mb-6">
                Manage user access to LogiVox directly from your existing directory service. 
                Whether you use Microsoft Entra ID (Azure AD), Okta, Google Workspace, or generic SAML, 
                we ensure secure and compliant access.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Zero Trust Security</h3>
                    <p className="text-slate-600">Enforce MFA and conditional access policies defined in your IdP.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">SCIM Provisioning</h3>
                    <p className="text-slate-600">Automate user onboarding and offboarding via SCIM 2.0.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-xl border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Supported Providers
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {["Microsoft Entra ID", "Okta", "Google Workspace", "Auth0", "OneLogin", "PingIdentity"].map((p) => (
                  <div key={p} className="flex items-center gap-2 p-3 bg-white rounded-lg border shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-16 bg-slate-50 border-y">
        <div className="container-enterprise">
          <h2 className="text-3xl font-bold mb-12 text-center">Setup & Configuration</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {integrationSteps.map((step) => (
              <Card key={step.step} className="relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-sm">
                  {step.step}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Synced Data */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-3xl font-bold mb-12 text-center">Data Synchronization</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {syncedData.map((data) => (
              <Card key={data.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-2 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>{data.title}</CardTitle>
                  <CardDescription>{data.frequency}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{data.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to secure your access?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Contact our security team to enable enterprise SSO and configure your identity provider.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Enable Enterprise SSO</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-slate-600 hover:bg-slate-700 text-white" asChild>
              <Link href="/docs/api">View API Documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
