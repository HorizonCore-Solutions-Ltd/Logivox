
import { Metadata } from "next";
import Link from "next/link";
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
  Zap,
  Move,
  BarChart,
  Layers,
  ArrowRight,
  CheckCircle2,
  Box,
  Cpu,
  RefreshCw,
  Scale,
  BrainCircuit,
  LayoutGrid
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Slotting Optimization | Warehouse Layout Logic - LogiVox",
  description:
    "Maximize warehouse efficiency with AI-driven slotting. Automatically organize inventory based on velocity, size, and affinity rules.",
  keywords: [
    "warehouse slotting",
    "inventory optimization",
    "velocity analysis",
    "putaway logic",
    "warehouse layout",
  ],
};

export default function SlottingOptimizationPage() {
  const features = [
    {
      icon: Zap,
      title: "Velocity-Based Slotting",
      description:
        "Automatically identifies fast-moving 'A' items and directs them to golden zones near shipping docks to minimize travel time.",
    },
    {
      icon: BrainCircuit,
      title: "Consolidation Logic",
      description:
        "Smart algorithms detect fragmented inventory and suggest consolidation moves to free up valuable bin space.",
    },
    {
      icon: LayoutGrid,
      title: "Dynamic Heat Mapping",
      description:
        "Visualize your warehouse activity with real-time heat maps. See congestion points and optimize traffic flow instantly.",
    },
    {
      icon: Scale,
      title: "Volumetric Optimization",
      description:
        "Matches item dimensions to bin capacities perfectly. Eliminates 'air shipping' within your own racking systems.",
    },
    {
      icon: RefreshCw,
      title: "Seasonal Re-Slotting",
      description:
        "Predictive modeling suggests layout changes before peak seasons hit, ensuring you're ready for demand shifts.",
    },
    {
      icon: Layers,
      title: "Affinity Analysis",
      description:
        "Groups items that are frequently ordered together (e.g., shampoo and conditioner) in adjacent slots to speed up picking.",
    },
  ];

  const benefits = [
    {
      title: "Reduce Travel Time",
      value: "40%",
      description: "Cut down picker walking distance by placing high-velocity items in prime locations."
    },
    {
      title: "Increase Storage Density",
      value: "25%",
      description: "Reclaim wasted space by matching SKU sizes to appropriate bin types automatically."
    },
    {
      title: "Boost Pick Rate",
      value: "30%",
      description: "Faster picks mean more orders out the door per shift with the same workforce."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-white pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1 text-sm font-medium">
              New: Enterprise Slotting Engine
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Stop Guessing Where to Put Inventory
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Let our AI Slotting Engine organize your warehouse for you. 
              Ideally place every pallet, case, and unit based on real-time velocity data and physical constraints.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-lg" asChild>
                <Link href="/demo">
                  Get a Slotting Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
                <Link href="/solutions/warehouse-management">
                  Explore WMS
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              The Brain Behind Your Racks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manual slotting with spreadsheets is obsolete. Our engine continuously analyzes thousands of data points to keep your warehouse optimized.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {benefits.map((benefit, index) => (
              <div key={index} className="px-4 py-8 md:py-0">
                <div className="text-5xl font-extrabold text-primary mb-2">
                  {benefit.value}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">
                Optimization on Autopilot
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-none bg-blue-100 p-2 rounded-full h-10 w-10 flex items-center justify-center text-blue-700 font-bold">1</div>
                  <div>
                    <h3 className="font-semibold text-lg">Analyze Purchasing Patterns</h3>
                    <p className="text-muted-foreground">The system ingests your order history to calculate SKU velocity (Fast, Medium, Slow movers).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none bg-blue-100 p-2 rounded-full h-10 w-10 flex items-center justify-center text-blue-700 font-bold">2</div>
                  <div>
                    <h3 className="font-semibold text-lg">Map Physical Constraints</h3>
                    <p className="text-muted-foreground">We verify product dimensions against bin capacities to ensure a perfect physical fit.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none bg-blue-100 p-2 rounded-full h-10 w-10 flex items-center justify-center text-blue-700 font-bold">3</div>
                  <div>
                    <h3 className="font-semibold text-lg">Generate Move Tasks</h3>
                    <p className="text-muted-foreground">Correction tasks are automatically generated for downtime, guiding workers to move items to their optimal homes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 aspect-square flex items-center justify-center">
               <div className="text-center">
                 <Move className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                 <p className="text-gray-500 font-medium">Interactive Slotting Heatmap Visualization</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to Optimize Your Warehouse Layout?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            See how much space and time you can save with our Slotting Engine.
          </p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-lg" asChild>
            <Link href="/contact">
              Talk to an Optimization Expert
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
