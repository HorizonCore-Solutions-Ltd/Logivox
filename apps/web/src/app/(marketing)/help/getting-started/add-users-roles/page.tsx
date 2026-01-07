import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle2, Shield, Users, AlertCircle, Lightbulb } from "lucide-react"

export const metadata: Metadata = {
  title: "Adding Users and Assigning Roles | LogiVox Help Center",
  description: "Learn how to invite team members and configure role-based access control in LogiVox WMS.",
}

export default function AddUsersRolesPage() {
  const roles = [
    {
      name: "Administrator",
      description: "Full system access including configuration, user management, and all features",
      permissions: ["All permissions", "User management", "System configuration", "Billing access"]
    },
    {
      name: "Warehouse Manager",
      description: "Manage daily operations, view reports, assign tasks, but cannot modify system settings",
      permissions: ["View all data", "Manage inventory", "Create orders", "Assign tasks", "View reports"]
    },
    {
      name: "Supervisor",
      description: "Oversee team activities, approve tasks, and access operational reports",
      permissions: ["View team data", "Approve tasks", "Basic reporting", "Manage assigned teams"]
    },
    {
      name: "Warehouse Operator",
      description: "Perform daily tasks like receiving, picking, packing, and shipping",
      permissions: ["Receiving", "Picking", "Packing", "Inventory moves", "Basic scanning"]
    },
    {
      name: "Inventory Clerk",
      description: "Focused on inventory management, cycle counting, and stock adjustments",
      permissions: ["View inventory", "Cycle counting", "Stock adjustments", "Location management"]
    },
    {
      name: "Read-Only",
      description: "View-only access for auditors, clients, or external stakeholders",
      permissions: ["View inventory", "View orders", "View reports", "No modifications"]
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb */}
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-8">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <span>/</span>
            <Link href="/help/getting-started" className="hover:text-primary">Getting Started</Link>
            <span>/</span>
            <span>Add Users & Roles</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">3 min read</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Adding Users and Assigning Roles</h1>
          <p className="text-xl text-muted-foreground">
            Invite team members and configure role-based access control to keep your data secure.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            <Alert className="mb-8">
              <Shield className="h-4 w-4" />
              <AlertTitle>Security First</AlertTitle>
              <AlertDescription>
                LogiVox uses role-based access control (RBAC) to ensure users only access what they need. Always follow the principle of least privilege.
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">Step 1: Navigate to User Management</h2>
            <Card className="mb-8">
              <CardContent className="p-6">
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">1.</span>
                    <span>Click <strong>Settings</strong> in the sidebar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">2.</span>
                    <span>Select <strong>Users & Teams</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">3.</span>
                    <span>Click <strong>"+ Invite User"</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Step 2: Enter User Information</h2>
            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Email Address</h3>
                <p className="text-muted-foreground">
                  Enter the user's work email. They'll receive an invitation link to create their account.
                </p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Full Name</h3>
                <p className="text-muted-foreground">
                  First and last name. This will appear throughout the system for audit trails.
                </p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Role Assignment</h3>
                <p className="text-muted-foreground">
                  Select the appropriate role based on their job function (see roles below).
                </p>
              </div>
              
              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Warehouse Access (Optional)</h3>
                <p className="text-muted-foreground">
                  If you have multiple warehouses, specify which ones this user can access.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Understanding User Roles</h2>
            <p className="text-muted-foreground mb-6">
              Choose the role that matches the user's responsibilities:
            </p>

            <div className="space-y-4 mb-8">
              {roles.map((role) => (
                <Card key={role.name}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{role.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert className="mb-8">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Custom Roles Available</AlertTitle>
              <AlertDescription>
                Need a custom role with specific permissions? Enterprise plans can create custom roles tailored to your organization. <Link href="/contact?subject=custom-roles" className="text-primary hover:underline">Contact us</Link> to learn more.
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">Step 3: Send the Invitation</h2>
            <Card className="mb-8">
              <CardContent className="p-6">
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">1.</span>
                    <div>
                      <p className="font-medium">Review the information</p>
                      <p className="text-sm text-muted-foreground">Double-check email, name, and role assignment</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">2.</span>
                    <div>
                      <p className="font-medium">Click "Send Invitation"</p>
                      <p className="text-sm text-muted-foreground">The user will receive an email with setup instructions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">3.</span>
                    <div>
                      <p className="font-medium">User accepts and creates password</p>
                      <p className="text-sm text-muted-foreground">They have 7 days to accept the invitation</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Managing Existing Users</h2>
            <p className="text-muted-foreground mb-6">
              After users are added, you can:
            </p>
            
            <div className="grid gap-4 mb-8">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <strong>Change Roles</strong> - Update a user's permissions at any time
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <strong>Deactivate Users</strong> - Temporarily disable access without deleting the account
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <strong>View Activity Logs</strong> - Track what users are doing in the system
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <strong>Resend Invitations</strong> - If the original email was missed
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mb-8" variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Billing Note</AlertTitle>
              <AlertDescription>
                Users are billed monthly based on your plan. Active users count toward your subscription limit. Deactivated users don't count.
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
            <Card className="mb-8">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Use work emails only</strong> - Don't use personal email addresses for business accounts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Start with less access</strong> - You can always grant more permissions later</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Limit administrators</strong> - Only give admin access to those who truly need it</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Review users quarterly</strong> - Remove access for employees who've left or changed roles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Enable 2FA</strong> - Require two-factor authentication for administrator accounts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
            <div className="grid gap-4 mb-8">
              <Link href="/help/getting-started/configure-locations">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Configure Warehouse Locations</h3>
                      <p className="text-sm text-muted-foreground">Set up your storage areas</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/help/getting-started/import-inventory">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Import Your Inventory</h3>
                      <p className="text-sm text-muted-foreground">Upload your product catalog</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </CardContent>
                </Card>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      <section className="border-t py-8 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/help/getting-started/setup-first-warehouse">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Setup Warehouse
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/configure-locations">
                Next: Configure Locations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Helpful Section */}
      <section className="border-t py-8">
        <div className="container-enterprise max-w-4xl text-center">
          <h3 className="font-semibold mb-4">Was this article helpful?</h3>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">👍 Yes</Button>
            <Button variant="outline">👎 No</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Need more help? <Link href="/contact?subject=help-user-management" className="text-primary hover:underline">Contact support</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
