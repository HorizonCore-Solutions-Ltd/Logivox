"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, TrendingUp, Lightbulb, Zap } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Welcome to LogiVox Insights!</h3>
          <p className="text-sm text-muted-foreground">
            Check your email for a welcome message and our latest warehouse
            optimization guide.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Stay Ahead with LogiVox Insights
              <Badge variant="secondary" className="text-xs">
                Weekly
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get warehouse optimization tips, industry trends, and new feature
              updates delivered to your inbox.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Industry Reports</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                <span>Best Practices</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Product Updates</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your business email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Subscribe
              </Button>
            </form>
            <div className="text-xs text-muted-foreground mt-2">
              Unsubscribe anytime. We respect your privacy.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
