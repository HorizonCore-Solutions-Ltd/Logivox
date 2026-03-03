"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<
    "idle" | "verifying" | "success" | "error"
  >(token ? "verifying" : "idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Auto-verify when token is present in URL
  React.useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setStatus("verifying");
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setErrorMessage(data.error || "Verification failed. Please try again.");
          setStatus("error");
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  // Resend flow
  const [resendEmail, setResendEmail] = React.useState("");
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message || "Verification email sent.");
    } catch {
      setResendMessage("Failed to send. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
              <Image
                src="/favicon.svg"
                alt="LogiVox Logo"
                width={40}
                height={40}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="text-2xl font-bold text-foreground">LogiVox</span>
          </Link>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {status === "success"
                ? "Email Verified!"
                : status === "error"
                  ? "Verification Failed"
                  : status === "verifying"
                    ? "Verifying…"
                    : "Verify Your Email"}
            </CardTitle>
            <CardDescription className="text-center">
              {status === "idle" && "Enter your email to resend the verification link."}
              {status === "verifying" && "Please wait while we verify your email."}
              {status === "success" && "Your email has been verified. You can now sign in."}
              {status === "error" && (errorMessage || "The verification link is invalid or expired.")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Verifying spinner */}
            {status === "verifying" && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            )}

            {/* Success state */}
            {status === "success" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/sign-in">Continue to Sign In</Link>
                </Button>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-sm text-destructive">{errorMessage}</span>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Request a new verification link below.
                </p>

                {resendMessage ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      {resendMessage}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-3">
                    <div>
                      <label
                        htmlFor="resend-email"
                        className="block text-sm font-medium text-foreground mb-1"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="resend-email"
                          type="email"
                          required
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={resendLoading}>
                      {resendLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Idle state (no token in URL) */}
            {status === "idle" && (
              <div className="space-y-4">
                {resendMessage ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      {resendMessage}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-3">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground mb-1"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="email"
                          type="email"
                          required
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={resendLoading}>
                      {resendLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Verification Email
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Back to sign-in */}
            {status !== "verifying" && (
              <div className="text-center pt-2">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
