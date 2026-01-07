import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Code, 
  Key, 
  Shield, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Terminal,
  Book,
  Sparkles
} from "lucide-react"

export const metadata: Metadata = {
  title: "API Getting Started | LogiVox Documentation",
  description: "Get started with the LogiVox REST API. Learn authentication, make your first request, and explore core endpoints.",
}

export default function APIGettingStartedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border-b py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <Link href="/docs" className="hover:text-white">Documentation</Link>
            <span>/</span>
            <span>API Getting Started</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
              <Code className="h-6 w-6" />
            </div>
            <h1 className="text-5xl font-bold">API Getting Started</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Connect your applications to LogiVox with our powerful REST API. Automate warehouse operations, sync inventory, and integrate seamlessly.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Badge className="bg-green-500 text-white">v2.0</Badge>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">REST API</Badge>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">JSON</Badge>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Quick Start</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    1
                  </div>
                  <CardTitle>Get Your API Key</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Generate an API key from your LogiVox dashboard to authenticate your requests.
                </p>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary-600">→</span>
                    <span>Navigate to <strong>Settings</strong> → <strong>API Keys</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-600">→</span>
                    <span>Click <strong>"Generate New Key"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-600">→</span>
                    <span>Give your key a descriptive name and set permissions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-600">→</span>
                    <span>Copy and securely store your API key</span>
                  </li>
                </ol>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security Best Practice</AlertTitle>
                  <AlertDescription>
                    Never expose your API key in client-side code or public repositories. Store it securely in environment variables.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    2
                  </div>
                  <CardTitle>Make Your First Request</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Test your connection by fetching your warehouse list.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">cURL</span>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl https://api.logivox.com/v2/warehouses \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">JavaScript</span>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`const response = await fetch('https://api.logivox.com/v2/warehouses', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const warehouses = await response.json();
console.log(warehouses);`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Python</span>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.logivox.com/v2/warehouses', headers=headers)
warehouses = response.json()
print(warehouses)`}
                    </pre>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Expected Response</AlertTitle>
                  <AlertDescription>
                    <pre className="text-xs mt-2 bg-muted/50 p-2 rounded">
{`{
  "data": [
    {
      "id": "wh_123abc",
      "name": "Main Distribution Center",
      "code": "MDC",
      "status": "active"
    }
  ],
  "total": 1
}`}
                    </pre>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    3
                  </div>
                  <CardTitle>Explore Core Endpoints</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Start integrating with these essential endpoints:
                </p>
                <div className="grid gap-3">
                  <Link href="/docs/api/warehouses" className="group">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-primary-600" />
                        <div>
                          <div className="font-medium group-hover:text-primary">Warehouses</div>
                          <div className="text-sm text-muted-foreground">Manage warehouse locations</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>

                  <Link href="/docs/api/inventory" className="group">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-primary-600" />
                        <div>
                          <div className="font-medium group-hover:text-primary">Inventory</div>
                          <div className="text-sm text-muted-foreground">Query and update stock levels</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>

                  <Link href="/docs/api/orders" className="group">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-primary-600" />
                        <div>
                          <div className="font-medium group-hover:text-primary">Orders</div>
                          <div className="text-sm text-muted-foreground">Create and manage orders</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>

                  <Link href="/docs/api/shipments" className="group">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-primary-600" />
                        <div>
                          <div className="font-medium group-hover:text-primary">Shipments</div>
                          <div className="text-sm text-muted-foreground">Process and track shipments</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Key className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Authentication</h2>
          </div>

          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
              LogiVox API uses Bearer token authentication. Include your API key in the Authorization header of every request.
            </p>

            <Card>
              <CardHeader>
                <CardTitle>Authorization Header</CardTitle>
                <CardDescription>Standard format for all API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`Authorization: Bearer YOUR_API_KEY`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Key Scopes</CardTitle>
                <CardDescription>Control access with granular permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Read Access</div>
                      <div className="text-sm text-muted-foreground">Query warehouses, inventory, orders, and shipments</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Write Access</div>
                      <div className="text-sm text-muted-foreground">Create and update records (orders, inventory adjustments)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Delete Access</div>
                      <div className="text-sm text-muted-foreground">Remove records (use with caution)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Rate Limits</h2>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-2">1,000</div>
                  <div className="text-sm font-medium">Requests per hour</div>
                  <div className="text-xs text-muted-foreground mt-1">Standard tier</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-2">5,000</div>
                  <div className="text-sm font-medium">Requests per hour</div>
                  <div className="text-xs text-muted-foreground mt-1">Professional tier</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-2">Custom</div>
                  <div className="text-sm font-medium">Enterprise limits</div>
                  <div className="text-xs text-muted-foreground mt-1">Contact sales</div>
                </div>
              </div>

              <Alert className="mt-6">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Rate Limit Headers</AlertTitle>
                <AlertDescription>
                  Each response includes headers showing your current rate limit status:
                  <pre className="text-xs mt-2 bg-muted/50 p-2 rounded">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1672531200`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SDKs & Tools */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">SDKs & Tools</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Official SDKs</CardTitle>
                <CardDescription>Build faster with our client libraries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">JavaScript/TypeScript</span>
                  <Badge variant="secondary">npm install @logivox/sdk</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Python</span>
                  <Badge variant="secondary">pip install logivox</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">PHP</span>
                  <Badge variant="secondary">composer require logivox/sdk</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Ruby</span>
                  <Badge variant="secondary">gem install logivox</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>Resources to speed up development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/docs/postman" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors group">
                  <span className="font-medium group-hover:text-primary">Postman Collection</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/docs/openapi" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors group">
                  <span className="font-medium group-hover:text-primary">OpenAPI Spec</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/docs/webhooks" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors group">
                  <span className="font-medium group-hover:text-primary">Webhooks Guide</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/docs/sandbox" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors group">
                  <span className="font-medium group-hover:text-primary">API Sandbox</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container-enterprise max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-lg text-slate-300">
              Explore our comprehensive API documentation and integration guides.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/docs/api/reference">
              <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-6 text-center">
                  <Book className="h-8 w-8 text-white mx-auto mb-3" />
                  <div className="font-semibold text-white mb-2">API Reference</div>
                  <div className="text-sm text-slate-300">Complete endpoint documentation</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/docs/integrations">
              <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-white mx-auto mb-3" />
                  <div className="font-semibold text-white mb-2">Integration Guides</div>
                  <div className="text-sm text-slate-300">Connect with your stack</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help">
              <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-white mx-auto mb-3" />
                  <div className="font-semibold text-white mb-2">Support</div>
                  <div className="text-sm text-slate-300">Get help from our team</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
