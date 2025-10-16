"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import {
  Building2,
  Users,
  Shield,
  Mail,
  MoreHorizontal,
  UserPlus,
  Trash2,
  Crown,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { InviteMemberDialog } from "@/components/organizations/invite-member-dialog"

interface Organization {
  id: string
  name: string
  description: string | null
  website: string | null
  _count: {
    members: number
    inventoryItems: number
    bookings: number
    customers: number
  }
}

interface Member {
  id: string
  role: "ADMIN" | "MEMBER" | "VIEWER"
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: "ADMIN" | "MEMBER" | "VIEWER"
  status: string
  createdAt: string
  inviter: {
    id: string
    name: string | null
    email: string
  }
}

export default function OrganizationSettingsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const queryClient = useQueryClient()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false)
  const [orgName, setOrgName] = React.useState("")
  const [orgDescription, setOrgDescription] = React.useState("")
  const [orgWebsite, setOrgWebsite] = React.useState("")

  // Assume first organization for now (we'll add org switcher later)
  const orgId = session?.user?.organizations?.[0]?.id

  const { data: organization, isLoading: isLoadingOrg } = useQuery<Organization>({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch organization")
      return response.json()
    },
    enabled: !!orgId,
  })

  const { data: members, isLoading: isLoadingMembers } = useQuery<Member[]>({
    queryKey: ["organization", orgId, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}/members`)
      if (!response.ok) throw new Error("Failed to fetch members")
      return response.json()
    },
    enabled: !!orgId,
  })

  const { data: invitations, isLoading: isLoadingInvitations } = useQuery<Invitation[]>({
    queryKey: ["organization", orgId, "invitations"],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}/invitations`)
      if (!response.ok) throw new Error("Failed to fetch invitations")
      return response.json()
    },
    enabled: !!orgId,
  })

  // Set form values when organization loads
  React.useEffect(() => {
    if (organization) {
      setOrgName(organization.name || "")
      setOrgDescription(organization.description || "")
      setOrgWebsite(organization.website || "")
    }
  }, [organization])

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; website?: string }) => {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update organization")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] })
      toast.success("Organization updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const response = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update member role")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId, "members"] })
      toast.success("Member role updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to remove member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId, "members"] })
      toast.success("Member removed successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleUpdateOrg = () => {
    updateOrgMutation.mutate({
      name: orgName,
      description: orgDescription,
      website: orgWebsite,
    })
  }

  const handleChangeRole = (memberId: string, role: string) => {
    updateMemberRoleMutation.mutate({ memberId, role })
  }

  const handleRemoveMember = (memberId: string, memberName: string | null) => {
    if (confirm(`Are you sure you want to remove ${memberName || "this member"}?`)) {
      removeMemberMutation.mutate(memberId)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />Admin</Badge>
      case "MEMBER":
        return <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Member</Badge>
      case "VIEWER":
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />Viewer</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const currentMember = members?.find((m) => m.user.id === session?.user?.id)
  const isAdmin = currentMember?.role === "ADMIN"

  if (!orgId) {
    return (
      <DashboardSidebar>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No organization found</p>
        </div>
      </DashboardSidebar>
    )
  }

  return (
    <DashboardSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings, members, and permissions.
          </p>
        </div>

        {isLoadingOrg ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[400px]" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">
                Members {members && `(${members.length})`}
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations {invitations && invitations.filter(i => i.status === "PENDING").length > 0 && 
                `(${invitations.filter(i => i.status === "PENDING").length})`}
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Information
                  </CardTitle>
                  <CardDescription>
                    Update your organization's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      rows={3}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  {isAdmin && (
                    <Button 
                      onClick={handleUpdateOrg}
                      disabled={updateOrgMutation.isPending}
                    >
                      {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{organization?._count.members}</p>
                        <p className="text-sm text-muted-foreground">Members</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <Building2 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{organization?._count.inventoryItems}</p>
                        <p className="text-sm text-muted-foreground">Inventory Items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <Shield className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{organization?._count.bookings}</p>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <Users className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{organization?._count.customers}</p>
                        <p className="text-sm text-muted-foreground">Customers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members */}
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </CardTitle>
                      <CardDescription>
                        Manage your organization's team members and their roles
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <Button onClick={() => setIsInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members?.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  {member.user.image ? (
                                    <img
                                      src={member.user.image}
                                      alt={member.user.name || ""}
                                      className="h-10 w-10 rounded-full"
                                    />
                                  ) : (
                                    <Users className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.user.name || "Unnamed User"}
                                    {member.user.id === session?.user?.id && (
                                      <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {member.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(member.role)}</TableCell>
                            <TableCell>
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {isAdmin && member.user.id !== session?.user?.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.id, "ADMIN")}>
                                      <Crown className="mr-2 h-4 w-4" />
                                      Make Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.id, "MEMBER")}>
                                      <Users className="mr-2 h-4 w-4" />
                                      Make Member
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.id, "VIEWER")}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Make Viewer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveMember(member.id, member.user.name)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove Member
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invitations */}
            <TabsContent value="invitations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Pending Invitations
                  </CardTitle>
                  <CardDescription>
                    View and manage pending invitations to your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInvitations ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  ) : invitations && invitations.filter(i => i.status === "PENDING").length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Invited By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations
                          .filter((invitation) => invitation.status === "PENDING")
                          .map((invitation) => (
                            <TableRow key={invitation.id}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {invitation.email}
                              </TableCell>
                              <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                              <TableCell>{invitation.inviter.name || invitation.inviter.email}</TableCell>
                              <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline">Pending</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pending invitations
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        organizationId={orgId}
      />
    </DashboardSidebar>
  )
}
