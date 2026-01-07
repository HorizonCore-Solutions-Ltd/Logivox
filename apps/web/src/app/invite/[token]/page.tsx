"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Building2,
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    description: string | null;
  };
  inviter: {
    name: string | null;
    email: string;
  };
}

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = params.token as string;

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery<Invitation>({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const response = await fetch(`/api/invitations/${token}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch invitation");
      }
      return response.json();
    },
    enabled: !!token && !!session,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept invitation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Successfully joined organization");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "MEMBER":
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Member
          </Badge>
        );
      case "VIEWER":
        return (
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />
            Viewer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "This invitation may have expired or been revoked"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold text-lg mb-2">
                {invitation.organization.name}
              </h3>
              {invitation.organization.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {invitation.organization.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Your role:</span>
                {getRoleBadge(invitation.role)}
              </div>
            </div>

            {/* Invitation Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invited to:</span>
                <span className="font-medium">{invitation.email}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invited by:</span>
                <span className="font-medium">
                  {invitation.inviter.name || invitation.inviter.email}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Role Description */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">
              What you'll be able to do:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {invitation.role === "ADMIN" && (
                <>
                  <li>• Full access to all features</li>
                  <li>• Manage team members and settings</li>
                  <li>• Create, edit, and delete data</li>
                </>
              )}
              {invitation.role === "MEMBER" && (
                <>
                  <li>• View all organization data</li>
                  <li>• Create and edit inventory & bookings</li>
                  <li>• Cannot delete or manage settings</li>
                </>
              )}
              {invitation.role === "VIEWER" && (
                <>
                  <li>• View all organization data</li>
                  <li>• Cannot create, edit, or delete</li>
                  <li>• Read-only access</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept & Join Organization
                </>
              )}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you agree to join {invitation.organization.name} as a{" "}
            {invitation.role.toLowerCase()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
