"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Activity,
  ClipboardList
} from "lucide-react"

export default function LaborManagementPage() {
  const features = [
    {
      icon: Clock,
      title: "Time & Attendance",
      description: "Digital time clock with clock in/out, break tracking, and overtime management."
    },
    {
      icon: Activity,
      title: "Task Tracking",
      description: "Monitor task execution times, completion rates, and worker efficiency in real-time."
    },
    {
      icon: BarChart3,
      title: "Productivity Analytics",
      description: "Performance dashboards with KPIs, trends, and benchmarking across workers and shifts."
    },
    {
      icon: Target,
      title: "Labor Standards",
      description: "Engineered labor standards with expected vs actual time comparisons and variance analysis."
    },
    {
      icon: DollarSign,
      title: "Cost Analysis",
      description: "Labor cost per unit, cost per order, and profitability analysis by client or SKU."
    },
    {
      icon: Award,
      title: "Incentive Programs",
      description: "Performance-based incentives, gamification, and achievement tracking to boost morale."
    }
  ]

  const metrics = [
    {
      category: "Picking Performance",
      icon: ClipboardList,
      kpis: [
        { name: "Units per Hour", value: "185", benchmark: "150 standard", status: "good" },
        { name: "Pick Accuracy", value: "99.4%", benchmark: "98% target", status: "good" },
        { name: "Travel Time", value: "22%", benchmark: "25% typical", status: "good" },
        { name: "Lines per Hour", value: "42", benchmark: "35 standard", status: "good" }
      ]
    },
    {
      category: "Receiving Performance",
      icon: Briefcase,
      kpis: [
        { name: "Units Processed/Hr", value: "320", benchmark: "280 standard", status: "good" },
        { name: "Quality Check Rate", value: "98.5%", benchmark: "95% target", status: "good" },
        { name: "Putaway Time", value: "4.2 min", benchmark: "5 min standard", status: "good" },
        { name: "Accuracy Rate", value: "99.7%", benchmark: "99% target", status: "good" }
      ]
    },
    {
      category: "Packing Performance",
      icon: Target,
      kpis: [
        { name: "Packs per Hour", value: "38", benchmark: "30 standard", status: "good" },
        { name: "Packing Accuracy", value: "99.8%", benchmark: "99.5% target", status: "good" },
        { name: "Carton Utilization", value: "87%", benchmark: "80% target", status: "good" },
        { name: "Label Errors", value: "0.2%", benchmark: "0.5% max", status: "good" }
      ]
    }
  ]

  const timeClock = [
    {
      title: "Clock In/Out",
      description: "Simple mobile or terminal-based clock in/out with location verification",
      features: ["Face recognition", "PIN code", "Badge scan", "GPS verification", "Photo capture"]
    },
    {
      title: "Break Management",
      description: "Automatic break tracking with compliance monitoring and alerts",
      features: ["Scheduled breaks", "Unpaid lunch", "Rest periods", "Overtime alerts", "Compliance rules"]
    },
    {
      title: "Shift Scheduling",
      description: "Flexible shift planning with skill-based assignment and availability management",
      features: ["Shift templates", "Skill matching", "Availability", "Swap requests", "Coverage alerts"]
    }
  ]

  const taskTypes = [
    { name: "Receiving", avgTime: "3.2 min/pallet", standardTime: "4.0 min/pallet" },
    { name: "Putaway", avgTime: "2.8 min/task", standardTime: "3.5 min/task" },
    { name: "Picking", avgTime: "45 sec/line", standardTime: "55 sec/line" },
    { name: "Packing", avgTime: "1.6 min/order", standardTime: "2.0 min/order" },
    { name: "Cycle Count", avgTime: "35 sec/loc", standardTime: "45 sec/loc" },
    { name: "Replenishment", avgTime: "2.5 min/task", standardTime: "3.0 min/task" }
  ]

  const laborCostBreakdown = [
    { category: "Direct Labor", percentage: 65, amount: "$187,200" },
    { category: "Indirect Labor", percentage: 20, amount: "$57,600" },
    { category: "Benefits & Taxes", percentage: 15, amount: "$43,200" }
  ]

  const benefits = [
    {
      title: "35% Productivity Increase",
      icon: TrendingUp,
      description: "Real-time visibility and performance tracking drives efficiency improvements",
      stats: ["Before: 120 UPH", "After: 162 UPH", "Improvement: +42 UPH"]
    },
    {
      title: "$240K Annual Savings",
      icon: DollarSign,
      description: "Optimized labor allocation and reduced overtime through better planning",
      stats: ["Reduced overtime: 18%", "Better allocation: $180K", "Lower turnover: $60K"]
    },
    {
      title: "99.2% Attendance Rate",
      icon: CheckCircle2,
      description: "Improved engagement and accountability with transparent performance metrics",
      stats: ["Industry avg: 94%", "Your warehouse: 99.2%", "Improvement: +5.2%"]
    },
    {
      title: "Reduced Turnover 42%",
      icon: Users,
      description: "Better work environment with fair performance measurement and incentives",
      stats: ["Before: 28% annual", "After: 16% annual", "Savings: $85K/year"]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-enterprise relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Labor Management System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Optimize Your Workforce
              <span className="block text-primary mt-2">Maximize Productivity</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Complete labor management with time tracking, performance analytics, task monitoring, 
              and cost analysis. Increase productivity by 35% while reducing labor costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?solution=labor-management">
                  Request Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { label: "Productivity Gain", value: "+35%" },
                { label: "Annual Savings", value: "$240K" },
                { label: "Accuracy Rate", value: "99.2%" },
                { label: "Turnover Reduction", value: "-42%" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Labor Management Suite</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track, analyze, and optimize warehouse workforce
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all">
                <CardHeader>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    {feature.title}
                  </h3>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Real-Time Performance Tracking</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track worker performance across all warehouse operations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <metric.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{metric.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metric.kpis.map((kpi, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{kpi.name}</span>
                          <span className="text-primary font-bold">{kpi.value}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span>{kpi.benchmark}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Time & Attendance */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Time & Attendance Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete time tracking with compliance monitoring
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {timeClock.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Task Standards */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Engineered Labor Standards</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expected vs actual time comparison for all warehouse tasks
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {taskTypes.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground">Standard: {task.standardTime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{task.avgTime}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Above standard</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Labor Cost Analysis */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Labor Cost Analysis</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Detailed cost breakdown and profitability by operation
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Labor Cost Breakdown</CardTitle>
                <CardDescription>Total: $288,000/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {laborCostBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.percentage}% · {item.amount}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Cost per Unit</div>
                    <div className="text-2xl font-bold">$0.42</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Cost per Order</div>
                    <div className="text-2xl font-bold">$4.85</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Proven Business Impact</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real results from warehouses using LogiVox LMS
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                  </div>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {benefit.stats.map((stat, idx) => (
                      <div key={idx} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          {stat.split(':')[0]}
                        </div>
                        <div className="font-bold text-sm">
                          {stat.split(':')[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-enterprise text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize Your Workforce?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of warehouses increasing productivity with LogiVox LMS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact?solution=labor-management">
                Schedule Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
