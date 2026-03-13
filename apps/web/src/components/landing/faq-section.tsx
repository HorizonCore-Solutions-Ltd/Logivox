"use client";

// FAQSection: addresses top buyer objections (security, onboarding, offline, integrations, ROI) on the landing page.

const faqs = [
  {
    q: "Is setup fast and supported?",
    a: "Yes. Most customers go live in hours using prebuilt workflows. Our team is available for guided onboarding and data import help.",
  },
  {
    q: "How do you secure data?",
    a: "Role-based access across facilities, secure data synchronization, comprehensive audit trails, and strict SOC 2/ISO compliance. Voice stays in-browser.",
  },
  {
    q: "What if Wi-Fi drops on the floor?",
    a: "Voice and scans keep working with queued sync. Delivery and retry visibility ensure nothing is lost.",
  },
  {
    q: "Do you integrate with our stack?",
    a: "Yes. Our platform seamlessly synchronizes with leading ERPs, carriers, and ecommerce systems, ensuring order accuracy and continuous updates.",
  },
  {
    q: "How fast is time-to-value?",
    a: "Expedited onboarding programs are available for global sites, ensuring rapid integration and immediate ROI demonstration within the first operational cycle.",
  },
  {
    q: "Do I need special hardware (Vocollect, etc)?",
    a: "No. LogiVox is device-agnostic. It runs on affordable Android/iOS smartphones ($300) or enterprise Zebra TC5x devices. Use standard Bluetooth headsets (Jabra, BlueParrott, AirPods).",
  },
  {
    q: "What is 'Hybrid Choice' voice?",
    a: "It gives you the best of both worlds. New hires use 'Rookie Mode' (Screen showing images + Voice) for training, while experts use 'Speed Mode' (Screen off/pocketed) for maximum throughput.",
  },
  {
    q: "How does the 'OLED Black' mode save battery?",
    a: "In Pro Mode, we turn off 99% of the screen pixels (OLED Black), waking only for exceptions. This extends standard consumer device battery life to cover full 10-hour shifts.",
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
