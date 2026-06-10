"use client";

// FAQSection: addresses top buyer objections (security, onboarding, offline, integrations, ROI) on the landing page.

const faqs = [
  {
    q: "Is setup fast and supported?",
    a: "Yes. Most customers go live in hours using prebuilt workflows. Our team is available for guided onboarding and data import help.",
  },
  {
    q: "How do you secure data?",
    a: "Role-based access across facilities, secure synchronization, audit trails, tenant isolation, and explicit backup and restore controls.",
  },
  {
    q: "What if Wi-Fi drops on the floor?",
    a: "Voice and scans keep working with queued sync. Retry queues, offline recovery, and replay visibility ensure nothing is lost.",
  },
  {
    q: "Do you integrate with our stack?",
    a: "Yes. Certified enterprise connectors, mapping templates, and schema validation support ERPs, carriers, IoT, and other core systems.",
  },
  {
    q: "How fast is time-to-value?",
    a: "The platform is designed for rapid validation and rollout, with health checks and environment validation keeping the deployment path predictable.",
  },
  {
    q: "Do I need special hardware (Vocollect, etc)?",
    a: "No. LogiVox is device-agnostic. It runs on affordable Android/iOS smartphones ($300) or enterprise Zebra TC5x devices. Use standard Bluetooth headsets (Jabra, BlueParrott, AirPods).",
  },
  {
    q: "What is 'Hybrid Choice' voice?",
    a: "It lets LogiVox adapt to the operator. New hires can use screen-plus-voice guidance while experts can move into faster voice-led execution.",
  },
  {
    q: "How do you handle failures and recovery?",
    a: "The system uses retries, circuit breakers, workflow recovery, and clear failure logs so operators can see what failed and what was replayed.",
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
