import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Webhook,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Webhooks | LogiVox Docs",
  description: "Configure webhooks to receive real-time events from LogiVox.",
};

const EVENT_TYPES = [
  { event: "shipment.created", desc: "A new shipment has been created" },
  { event: "shipment.label_purchased", desc: "A shipping label was purchased" },
  {
    event: "shipment.in_transit",
    desc: "Shipment is now in transit with the carrier",
  },
  { event: "shipment.delivered", desc: "Shipment has been delivered" },
  { event: "shipment.exception", desc: "A delivery exception occurred" },
  {
    event: "inventory.low_stock",
    desc: "An item has fallen below its reorder point",
  },
  { event: "inventory.out_of_stock", desc: "An item has reached zero stock" },
  { event: "inventory.adjusted", desc: "Inventory was manually adjusted" },
  { event: "order.created", desc: "A new sales order was created" },
  { event: "order.status_changed", desc: "A sales order status changed" },
  { event: "order.fulfilled", desc: "A sales order was fully fulfilled" },
  { event: "rma.created", desc: "A new RMA was created" },
  { event: "rma.completed", desc: "An RMA was completed and stock restocked" },
  { event: "pick_list.assigned", desc: "A pick list was assigned to a picker" },
  { event: "pick_list.completed", desc: "A pick list was completed" },
];

export default function WebhooksDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Docs
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Webhooks</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Webhook className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Webhooks</h1>
              <p className="text-muted-foreground">
                Receive real-time event notifications from LogiVox
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge>v1.0</Badge>
            <Badge variant="secondary">HTTPS POST</Badge>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            Webhooks allow your application to be notified automatically when
            events occur in LogiVox. When a configured event occurs, we send an
            HTTP POST request to your endpoint URL with a JSON payload
            describing the event.
          </p>
          <div className="bg-muted/50 border rounded-xl p-6 space-y-3">
            <p className="text-sm font-medium">To get started:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Navigate to{" "}
                <Link
                  href="/dashboard/settings"
                  className="text-primary hover:underline"
                >
                  Settings → Webhooks
                </Link>
              </li>
              <li>
                Click <strong>Add Endpoint</strong> and enter your URL
              </li>
              <li>Select the events you want to receive</li>
              <li>Save and test your endpoint</li>
            </ol>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Payload Structure
          </h2>
          <p className="text-muted-foreground text-sm">
            Every webhook delivery shares the same envelope structure:
          </p>
          <div className="bg-muted rounded-xl p-4 font-mono text-sm overflow-x-auto">
            {`{
  "id": "evt_01H9X2K...",
  "event": "shipment.delivered",
  "timestamp": "2025-01-15T14:32:00.000Z",
  "apiVersion": "2025-01-01",
  "organizationId": "org_...",
  "data": {
    // event-specific payload
  }
}`}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Signature Verification
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All webhook deliveries include a{" "}
            <code className="bg-muted px-1 rounded text-xs">
              X-LogiVox-Signature
            </code>{" "}
            header. This is an HMAC-SHA256 signature of the raw request body
            using your webhook signing secret. Always verify this signature
            before processing the payload.
          </p>
          <div className="bg-muted rounded-xl p-4 font-mono text-sm overflow-x-auto">
            {`// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Retry Policy
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            LogiVox will retry failed webhook deliveries up to{" "}
            <strong>5 times</strong> with exponential backoff (5s, 30s, 5min,
            30min, 2h). An endpoint is considered failed if it returns a non-2xx
            status code or times out after 30 seconds. After all retries are
            exhausted, the delivery is marked as failed and you will receive an
            alert.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Event Types</h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Event</th>
                  <th className="text-left px-5 py-3 font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {EVENT_TYPES.map((e, i) => (
                  <tr
                    key={e.event}
                    className={i % 2 === 0 ? "" : "bg-muted/20"}
                  >
                    <td className="px-5 py-3 font-mono text-xs">{e.event}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {e.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border rounded-xl p-6 bg-muted/30 space-y-3">
          <h2 className="text-lg font-semibold">Need help?</h2>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/docs">Back to Docs</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
