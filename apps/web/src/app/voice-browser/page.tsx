export const metadata = {
  title: "Voice Browser Guide | LogiVox",
  description:
    "How to use the LogiVox voice browser to navigate marketing pages and the authenticated app with hands-free commands.",
};

const marketingCommands = [
  {
    phrase: "Go to homepage",
    action: "Navigates to the main marketing page",
  },
  {
    phrase: "Show features",
    action: "Scrolls to the product features section",
  },
  {
    phrase: "Show pricing",
    action: "Scrolls to the pricing section",
  },
  {
    phrase: "Show proof",
    action: "Jumps to the trust / proof points section",
  },
  {
    phrase: "Get started",
    action: "Moves to the call-to-action section so you can start a trial",
  },
  {
    phrase: "Login",
    action: "Opens the sign-in page",
  },
  {
    phrase: "Sign up",
    action: "Opens the sign-up page",
  },
  {
    phrase: "Open docs",
    action: "Opens the documentation portal",
  },
  {
    phrase: "Contact support",
    action: "Opens the support page",
  },
  {
    phrase: "Voice help",
    action: "Returns to this guide for reminders",
  },
];

const appCommands = [
  {
    phrase: "Go to dashboard",
    action: "Opens the main dashboard (requires sign-in)",
  },
  {
    phrase: "Go to inventory",
    action: "Opens the inventory workspace",
  },
  {
    phrase: "Go to reports",
    action: "Opens analytics and reporting",
  },
  {
    phrase: "Check alerts",
    action: "Opens the alerts center",
  },
  {
    phrase: "Go to customers",
    action: "Opens the customers page",
  },
  {
    phrase: "Find {product}",
    action: "Searches inventory for the named product",
  },
];

const faqs = [
  {
    q: "Which browsers work best?",
    a: "Chrome and Edge have the most reliable Web Speech API support. Safari works but may require mic permission each session.",
  },
  {
    q: "Do I have to be logged in?",
    a: "No. Marketing navigation works without login. Account-specific commands (dashboard, inventory, reports) require sign-in.",
  },
  {
    q: "How do I start and stop listening?",
    a: "Click the floating mic, or use Ctrl/Cmd + Shift + V to toggle listening. Use Ctrl/Cmd + Shift + H to show the in-app help panel.",
  },
  {
    q: "Is my voice data stored?",
    a: "Recognition stays in the browser via the Web Speech API. We do not send transcripts to our servers unless a command triggers an API action you can see on screen.",
  },
];

export default function VoiceBrowserGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-20">
      <div className="container-enterprise max-w-5xl py-12 space-y-10">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
            Voice Navigation
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Voice Browser Guide & Cheat Sheet
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Navigate LogiVox hands-free across marketing pages and the
            authenticated app. Allow microphone access, say a command, and the
            voice browser routes you where you need to go.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              Ctrl/Cmd + Shift + V — Toggle listening
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Ctrl/Cmd + Shift + H — Open help
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Works without login for marketing pages
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Quick start</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                Click the floating mic (bottom-right) and allow microphone
                access.
              </li>
              <li>
                Say a navigation command like “Show pricing” or “Go to
                dashboard”.
              </li>
              <li>
                Watch the transcript and confirmation in the panel; say another
                command or toggle listening off.
              </li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              Tip: Use a headset in noisy spaces for higher accuracy.
            </p>
          </div>

          <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Troubleshooting</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <strong>Mic blocked:</strong> Check the browser address bar mic
                icon and allow access.
              </li>
              <li>
                <strong>No response:</strong> Verify the mic icon is pulsing.
                Toggle with Ctrl/Cmd + Shift + V.
              </li>
              <li>
                <strong>Wrong page:</strong> Say “Voice help” to reopen this
                guide and confirm commands.
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/90 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Commands for visitors (no login needed)
            </h2>
            <span className="text-xs text-muted-foreground">
              Works on all marketing pages
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {marketingCommands.map((item) => (
              <div
                key={item.phrase}
                className="rounded-lg border bg-muted/40 px-4 py-3"
              >
                <p className="font-semibold">“{item.phrase}”</p>
                <p className="text-sm text-muted-foreground">{item.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card/90 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Commands for signed-in users
            </h2>
            <span className="text-xs text-muted-foreground">
              Requires authentication
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {appCommands.map((item) => (
              <div
                key={item.phrase}
                className="rounded-lg border bg-muted/40 px-4 py-3"
              >
                <p className="font-semibold">“{item.phrase}”</p>
                <p className="text-sm text-muted-foreground">{item.action}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Need more? Say “help” inside the voice panel to hear the full
            catalog of in-app commands.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/90 backdrop-blur p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="space-y-1">
                <p className="font-semibold">{item.q}</p>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-primary/10 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Need a human?</p>
            <p className="text-muted-foreground text-sm">
              Reach out to support or open the documentation for deeper dives.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/services/support"
              className="rounded-lg border border-primary bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Contact support
            </a>
            <a
              href="/docs"
              className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Open docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
