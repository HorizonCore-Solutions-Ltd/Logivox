"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Star,
  Zap,
  DollarSign,
  Clock,
  Users,
  Shield,
  Mic,
  Brain,
  Smartphone,
  CloudCog,
} from "lucide-react";

interface CompetitorData {
  name: string;
  logo: string;
  tagline: string;
  pricing: {
    starting: string;
    model: string;
  };
  deployment: string;
  implementation: string;
  support: string;
  features: {
    voiceOperations: boolean | "limited";
    aiOptimization: boolean | "limited";
    mobileFirst: boolean | "limited";
    realTimeAnalytics: boolean | "limited";
    cloudNative: boolean | "limited";
    customization: boolean | "limited";
    integrations: boolean | "limited";
    multiTenant: boolean | "limited";
  };
  pros: string[];
  cons: string[];
}

export function CompetitiveComparison() {
  const competitors: CompetitorData[] = [
    {
      name: "LogiVox",
      logo: "LV",
      tagline: "Voice-Powered Future of Warehousing",
      pricing: {
        starting: "$49/month",
        model: "Per user, transparent pricing",
      },
      deployment: "Cloud-native SaaS",
      implementation: "30-90 days",
      support: "24/7 expert support",
      features: {
        voiceOperations: true,
        aiOptimization: true,
        mobileFirst: true,
        realTimeAnalytics: true,
        cloudNative: true,
        customization: true,
        integrations: true,
        multiTenant: true,
      },
      pros: [
        "Revolutionary voice AI technology",
        "95% error reduction proven",
        "ROI visible in 30 days",
        "Modern cloud-native architecture",
        "Transparent pricing model",
        "Industry-leading support",
      ],
      cons: [
        "Newer player (established 2023)",
        "Best suited for modern operations",
      ],
    },
    {
      name: "SAP Extended Warehouse Management",
      logo: "SAP",
      tagline: "Enterprise Resource Planning Giant",
      pricing: {
        starting: "$150/user/month",
        model: "Complex licensing + consultants",
      },
      deployment: "On-premise or cloud",
      implementation: "12-24 months",
      support: "Partner-dependent",
      features: {
        voiceOperations: false,
        aiOptimization: "limited",
        mobileFirst: "limited",
        realTimeAnalytics: true,
        cloudNative: "limited",
        customization: true,
        integrations: true,
        multiTenant: false,
      },
      pros: [
        "Deep ERP integration",
        "Enterprise scalability",
        "Comprehensive functionality",
        "Strong financial modules",
      ],
      cons: [
        "Extremely high total cost",
        "Complex implementation",
        "Requires dedicated IT team",
        "Legacy architecture",
        "No voice operations",
      ],
    },
    {
      name: "Manhattan Associates WMS",
      logo: "MA",
      tagline: "Supply Chain Commerce Solutions",
      pricing: {
        starting: "$200+/user/month",
        model: "Enterprise licensing only",
      },
      deployment: "On-premise primary",
      implementation: "18-36 months",
      support: "Professional services",
      features: {
        voiceOperations: "limited",
        aiOptimization: "limited",
        mobileFirst: false,
        realTimeAnalytics: true,
        cloudNative: false,
        customization: true,
        integrations: true,
        multiTenant: false,
      },
      pros: [
        "Mature WMS platform",
        "Strong optimization algorithms",
        "Retail/fashion focus",
        "Omnichannel capabilities",
      ],
      cons: [
        "Very expensive ($500K+ implementations)",
        "Complex and slow to deploy",
        "Limited voice capabilities",
        "Legacy technology stack",
        "Requires significant IT resources",
      ],
    },
    {
      name: "Oracle WMS Cloud",
      logo: "ORA",
      tagline: "Database and Enterprise Software",
      pricing: {
        starting: "$180/user/month",
        model: "Subscription + services",
      },
      deployment: "Oracle Cloud only",
      implementation: "12-18 months",
      support: "Oracle support",
      features: {
        voiceOperations: false,
        aiOptimization: "limited",
        mobileFirst: "limited",
        realTimeAnalytics: true,
        cloudNative: true,
        customization: "limited",
        integrations: true,
        multiTenant: "limited",
      },
      pros: [
        "Strong database foundation",
        "Cloud-native platform",
        "Good integration ecosystem",
        "Enterprise security",
      ],
      cons: [
        "Expensive total cost",
        "Complex configuration",
        "Limited customization",
        "No voice operations",
        "Oracle ecosystem lock-in",
      ],
    },
    {
      name: "Fishbowl Inventory",
      logo: "FB",
      tagline: "Small Business Inventory Management",
      pricing: {
        starting: "$4,395 one-time",
        model: "Perpetual license + maintenance",
      },
      deployment: "On-premise",
      implementation: "3-6 months",
      support: "Email/phone support",
      features: {
        voiceOperations: false,
        aiOptimization: false,
        mobileFirst: false,
        realTimeAnalytics: "limited",
        cloudNative: false,
        customization: "limited",
        integrations: "limited",
        multiTenant: false,
      },
      pros: [
        "Lower upfront cost",
        "QuickBooks integration",
        "Simple for small businesses",
        "Established in SMB market",
      ],
      cons: [
        "Limited scalability",
        "No advanced features",
        "Desktop-based (outdated)",
        "No voice or AI capabilities",
        "Limited mobile functionality",
      ],
    },
  ];

  const [selectedCompetitor, setSelectedCompetitor] = React.useState<string>(
    "SAP Extended Warehouse Management",
  );
  const logiVox = competitors.find((c) => c.name === "LogiVox")!;
  const competitor = competitors.find((c) => c.name === selectedCompetitor)!;

  const FeatureIcon = ({
    feature,
    value,
  }: {
    feature: string;
    value: boolean | "limited";
  }) => {
    if (value === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (value === "limited") {
      return (
        <div className="h-4 w-4 rounded-full bg-yellow-400 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      );
    } else {
      return <X className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4">⚔️ Competitive Analysis</Badge>
        <h2 className="text-3xl font-bold mb-4">
          How LogiVox Compares to Traditional WMS
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          See why modern warehouses are choosing LogiVox over legacy systems
          that cost more, take longer to implement, and deliver less value.
        </p>
      </div>

      {/* Competitor Selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {competitors
          .filter((c) => c.name !== "LogiVox")
          .map((comp) => (
            <Button
              key={comp.name}
              variant={selectedCompetitor === comp.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCompetitor(comp.name)}
            >
              {comp.logo} {comp.name}
            </Button>
          ))}
      </div>

      {/* Comparison Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LogiVox Card */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-2">
              {logiVox.logo}
            </div>
            <CardTitle className="text-primary">{logiVox.name}</CardTitle>
            <CardDescription className="text-primary/80">
              {logiVox.tagline}
            </CardDescription>
            <Badge className="w-fit mx-auto">⭐ Recommended</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </div>
                <div className="text-muted-foreground">
                  {logiVox.pricing.starting}
                </div>
                <div className="text-xs text-muted-foreground">
                  {logiVox.pricing.model}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Implementation
                </div>
                <div className="text-muted-foreground">
                  {logiVox.implementation}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <CloudCog className="h-4 w-4" />
                  Deployment
                </div>
                <div className="text-muted-foreground">
                  {logiVox.deployment}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Support
                </div>
                <div className="text-muted-foreground">{logiVox.support}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Key Features</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4" />
                    Voice Operations
                  </span>
                  <FeatureIcon
                    feature="voiceOperations"
                    value={logiVox.features.voiceOperations}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />
                    AI Optimization
                  </span>
                  <FeatureIcon
                    feature="aiOptimization"
                    value={logiVox.features.aiOptimization}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4" />
                    Mobile-First Design
                  </span>
                  <FeatureIcon
                    feature="mobileFirst"
                    value={logiVox.features.mobileFirst}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Real-time Analytics
                  </span>
                  <FeatureIcon
                    feature="realTimeAnalytics"
                    value={logiVox.features.realTimeAnalytics}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 text-green-700">Advantages</h4>
              <ul className="space-y-1">
                {logiVox.pros.map((pro, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <Check className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold mx-auto mb-2">
              {competitor.logo}
            </div>
            <CardTitle>{competitor.name}</CardTitle>
            <CardDescription>{competitor.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </div>
                <div className="text-muted-foreground">
                  {competitor.pricing.starting}
                </div>
                <div className="text-xs text-muted-foreground">
                  {competitor.pricing.model}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Implementation
                </div>
                <div className="text-muted-foreground">
                  {competitor.implementation}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <CloudCog className="h-4 w-4" />
                  Deployment
                </div>
                <div className="text-muted-foreground">
                  {competitor.deployment}
                </div>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Support
                </div>
                <div className="text-muted-foreground">
                  {competitor.support}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Key Features</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4" />
                    Voice Operations
                  </span>
                  <FeatureIcon
                    feature="voiceOperations"
                    value={competitor.features.voiceOperations}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />
                    AI Optimization
                  </span>
                  <FeatureIcon
                    feature="aiOptimization"
                    value={competitor.features.aiOptimization}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4" />
                    Mobile-First Design
                  </span>
                  <FeatureIcon
                    feature="mobileFirst"
                    value={competitor.features.mobileFirst}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Real-time Analytics
                  </span>
                  <FeatureIcon
                    feature="realTimeAnalytics"
                    value={competitor.features.realTimeAnalytics}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Advantages</h4>
              <ul className="space-y-1">
                {competitor.pros.map((pro, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <Check className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 text-red-700">Disadvantages</h4>
              <ul className="space-y-1">
                {competitor.cons.map((con, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <X className="h-3 w-3 text-red-500 mt-0.5" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">
            Ready to Make the Smart Choice?
          </h3>
          <p className="text-muted-foreground mb-4">
            See why LogiVox delivers faster ROI, better user experience, and
            lower total cost than legacy WMS systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Get Personalized Demo
              <Star className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Download Comparison Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
