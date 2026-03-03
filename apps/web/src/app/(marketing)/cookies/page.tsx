import { Metadata } from "next";
import Link from "next/link";
import { Cookie, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Cookie Policy | Flowstock",
  description: "How Flowstock uses cookies and similar tracking technologies on our platform.",
};

const COOKIE_CATEGORIES = [
  {
    name: "Strictly Necessary",
    badge: "Required",
    description: "These cookies are essential for the website to function and cannot be switched off. They are used to authenticate users, prevent fraud, and maintain security.",
    examples: ["Session authentication tokens", "CSRF protection cookies", "Load balancer cookies"],
  },
  {
    name: "Performance & Analytics",
    badge: "Optional",
    description: "These cookies help us understand how visitors interact with our website so we can improve our service.",
    examples: ["Page view counts", "Error rate monitoring", "Feature usage analytics"],
  },
  {
    name: "Functional",
    badge: "Optional",
    description: "These cookies enable enhanced functionality and personalisation. They may be set by us or by third parties whose services we have added to our pages.",
    examples: ["Language preferences", "UI theme (dark/light mode)", "Dashboard layout preferences"],
  },
  {
    name: "Targeting & Marketing",
    badge: "Optional",
    description: "These cookies may be set through our website by our advertising partners to build a profile of your interests.",
    examples: ["Ad retargeting", "Conversion tracking", "Social media pixels"],
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between max-w-5xl mx-auto px-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2 font-semibold">← Flowstock</Link>
          </Button>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We use cookies and similar technologies to provide, protect, and improve our services.
          </p>
          <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <section className="prose max-w-none space-y-4">
          <h2 className="text-2xl font-semibold">What are cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and provide a better user experience. Some cookies are essential for the website to function properly, while others help us improve our services and deliver relevant content.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Cookie Categories</h2>
          <div className="grid gap-6">
            {COOKIE_CATEGORIES.map((cat) => (
              <div key={cat.name} className="border rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <Badge variant={cat.badge === "Required" ? "default" : "secondary"}>{cat.badge}</Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{cat.description}</p>
                <div>
                  <p className="text-sm font-medium mb-2">Examples:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cat.examples.map((ex) => <li key={ex} className="text-sm text-muted-foreground">{ex}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Settings className="h-6 w-6" />Managing Your Preferences</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can control or delete cookies through your browser settings. Most browsers allow you to block all or specific types of cookies. Note that blocking strictly necessary cookies may prevent you from using parts of our service.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For more information on managing cookies, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">allaboutcookies.org</a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Shield className="h-6 w-6" />Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Some cookies are placed by third-party services that appear on our pages. We do not control these cookies and recommend reviewing the privacy policies of those third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:privacy@flowstock.io" className="text-primary hover:underline">privacy@flowstock.io</a>.
          </p>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Flowstock. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
        </div>
      </footer>
    </div>
  );
}
