"use client";

// FAQSection: addresses top buyer objections (security, onboarding, offline, integrations, ROI) on the landing page.

const faqs = [
  {
    q: "Is setup fast and supported?",
    a: "Yes. Most customers go live in hours using prebuilt workflows. Our team is available for guided onboarding and data import help.",
  },
  {
    q: "How do you secure data?",
    a: "Zero-trust scopes per warehouse and integration, HMAC-signed webhooks, audit streaming, and SOC 2/ISO controls. Voice stays in-browser.",
  },
  {
    q: "What if Wi-Fi drops on the floor?",
    a: "Voice and scans keep working with queued sync. Delivery and retry visibility ensure nothing is lost.",
  },
  {
    q: "Do you integrate with our stack?",
    a: "Yes. ERP, carriers, ecommerce, and webhooks are supported. Delivery logs and retries help validate each integration.",
  },
  {
    q: "How fast is time-to-value?",
    a: "Day 1 trial access; week-one ROI checks with burn-rate alerts and SLO dashboards to prove reliability and savings.",
  },
];

export function FAQSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container-enterprise space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary">
            Questions? We’ve got answers.
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">FAQ</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Top concerns from new customers about security, reliability,
            onboarding, and integrations.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border bg-card/80 backdrop-blur p-4 shadow-sm hover:shadow-md transition"
            >
              <p className="font-semibold text-foreground">{item.q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
