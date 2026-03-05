"use client";

import * as React from "react";
import { 
  Smartphone, 
  Mic, 
  Eye, 
  Battery, 
  Zap, 
  GraduationCap 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function HybridChoiceSection() {
  const modes = [
    {
      title: "Rookie Mode",
      subtitle: "Visual + Voice",
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Perfect for onboarding. Screen shows product images, maps, and large text instructions to build confidence.",
      features: ["Visual Confirmation", "Reduced Anxiety", "Self-Training"],
      battery: "Standard",
      target: "Day 1 - Day 14"
    },
    {
      title: "Pro Mode",
      subtitle: "Voice Dominant",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Screen dims to OLED black to save battery. Wakes only for exceptions (short picks) or when you ask.",
      features: ["OLED Power Saving", "Exception Handling", "High Focus"],
      battery: "Extended",
      target: "Month 1+"
    },
    {
      title: "Speed Mode",
      subtitle: "Pure Voice",
      icon: Zap,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Screen off or pocketed. 100% audio interaction for maximum throughput and hands-free operation.",
      features: ["Maximum Speed", "Hands-Free", "Zero Distraction"],
      battery: "Maximum",
      target: "Expert / Veteran"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4" variant="outline">Adaptive UI Strategy</Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">
            Screen or No Screen? <br/>
            <span className="text-primary">The Choice is Yours.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            LogiVox doesn't force a philosophy. We provide a toolset. 
            Select the mode that fits your workforce proficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modes.map((mode, index) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={`h-full border-2 ${mode.borderColor} hover:shadow-lg transition-all`}>
                <CardHeader className={`${mode.bgColor} border-b ${mode.borderColor} py-8`}>
                  <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-4 shadow-sm mx-auto`}>
                    <mode.icon className={`w-6 h-6 ${mode.color}`} />
                  </div>
                  <Badge className="w-fit mx-auto mb-2 bg-white text-black border-gray-200 hover:bg-gray-100">
                    {mode.subtitle}
                  </Badge>
                  <CardTitle className="text-2xl font-bold text-center">{mode.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 text-center">
                  <div className="mb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-900 border-t border-b py-3">
                       <Smartphone className="w-4 h-4 text-gray-500" />
                       Persona: <span className={mode.color}>{mode.target}</span>
                    </div>

                    <ul className="space-y-2 text-left px-4">
                      {mode.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className={`w-1.5 h-1.5 rounded-full ${mode.color.replace('text-', 'bg-')}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                        <Battery className="w-3 h-3" />
                        Battery Impact: {mode.battery}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
