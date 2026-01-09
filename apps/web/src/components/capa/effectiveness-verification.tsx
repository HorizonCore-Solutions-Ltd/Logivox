/**
 * CAPA Effectiveness Verification Component
 * Interface for verifying CAPA effectiveness post-closure
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const verificationSchema = z.object({
  verificationMethod: z.string().min(10, "Verification method is required"),
  verificationPassed: z.boolean(),
  effectivenessScore: z.number().min(0).max(100),
  effectivenessNotes: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface EffectivenessVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capa: {
    id: string;
    capaNumber: string;
    problemStatement: string;
    closedDate: string;
    correctiveActions: any[];
    preventiveActions: any[];
  } | null;
  onSuccess?: () => void;
}

export function EffectivenessVerification({
  open,
  onOpenChange,
  capa,
  onSuccess,
}: EffectivenessVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      effectivenessScore: 85,
      verificationPassed: true,
    },
  });

  const effectivenessScore = watch("effectivenessScore");

  const onSubmit = async (data: VerificationFormData) => {
    if (!capa) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/capa/effectiveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capaId: capa.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify effectiveness");
      }

      const result = await response.json();
      toast.success(result.message);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error verifying effectiveness:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify effectiveness"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Highly Effective";
    if (score >= 70) return "Effective";
    if (score >= 50) return "Partially Effective";
    return "Ineffective";
  };

  if (!capa) return null;

  const daysSinceClosure = Math.floor(
    (Date.now() - new Date(capa.closedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CAPA Effectiveness Verification</DialogTitle>
          <DialogDescription>
            Verify the effectiveness of CAPA {capa.capaNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CAPA Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">CAPA Number:</span>{" "}
                {capa.capaNumber}
              </div>
              <div>
                <span className="font-medium">Problem Statement:</span>
                <p className="text-sm text-gray-600 mt-1">
                  {capa.problemStatement}
                </p>
              </div>
              <div>
                <span className="font-medium">Closed Date:</span>{" "}
                {new Date(capa.closedDate).toLocaleDateString()} ({daysSinceClosure}{" "}
                days ago)
              </div>
            </div>
          </div>

          {/* Actions Review */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Corrective Actions</h4>
              <p className="text-xs text-gray-600">
                {capa.correctiveActions.length} action(s) implemented
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Preventive Actions</h4>
              <p className="text-xs text-gray-600">
                {capa.preventiveActions.length} action(s) implemented
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Verification Method */}
            <div className="space-y-2">
              <Label htmlFor="verificationMethod">
                Verification Method *
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("verificationMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select verification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Data Analysis - Review quality metrics before/after CAPA">
                    Data Analysis - Review metrics
                  </SelectItem>
                  <SelectItem value="Process Audit - Verify procedures followed">
                    Process Audit
                  </SelectItem>
                  <SelectItem value="Physical Inspection - Check implementation">
                    Physical Inspection
                  </SelectItem>
                  <SelectItem value="Document Review - Verify records and procedures">
                    Document Review
                  </SelectItem>
                  <SelectItem value="Interviews - Confirm understanding and compliance">
                    Staff Interviews
                  </SelectItem>
                  <SelectItem value="Recurrence Check - Monitor for repeat issues">
                    Recurrence Check
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.verificationMethod && (
                <p className="text-sm text-red-500">
                  {errors.verificationMethod.message}
                </p>
              )}
            </div>

            {/* Verification Result */}
            <div className="space-y-2">
              <Label>Verification Result *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationPassed(true);
                    setValue("verificationPassed", true);
                    if (effectivenessScore < 70) setValue("effectivenessScore", 85);
                  }}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    verificationPassed === true
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <CheckCircle
                    className={`h-6 w-6 ${
                      verificationPassed === true
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div className="font-medium">Passed</div>
                    <div className="text-xs text-gray-600">
                      CAPA is effective
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationPassed(false);
                    setValue("verificationPassed", false);
                    if (effectivenessScore > 60) setValue("effectivenessScore", 50);
                  }}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    verificationPassed === false
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <XCircle
                    className={`h-6 w-6 ${
                      verificationPassed === false
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div className="font-medium">Failed</div>
                    <div className="text-xs text-gray-600">
                      CAPA is ineffective
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Effectiveness Score */}
            <div className="space-y-2">
              <Label htmlFor="effectivenessScore">
                Effectiveness Score (0-100) *
              </Label>
              <div className="space-y-2">
                <Input
                  id="effectivenessScore"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  {...register("effectivenessScore", { valueAsNumber: true })}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(effectivenessScore)}`}
                  >
                    {effectivenessScore}%
                  </span>
                  <Badge
                    className={
                      effectivenessScore >= 85
                        ? "bg-green-100 text-green-800"
                        : effectivenessScore >= 70
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {getScoreLabel(effectivenessScore)}
                  </Badge>
                </div>
              </div>
              {errors.effectivenessScore && (
                <p className="text-sm text-red-500">
                  {errors.effectivenessScore.message}
                </p>
              )}
            </div>

            {/* Warning for low scores */}
            {effectivenessScore < 70 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    Low Effectiveness Score
                  </p>
                  <p className="text-yellow-700 mt-1">
                    A score below 70% will trigger an automatic Re-CAPA to
                    address the root cause more effectively.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="effectivenessNotes">
                Verification Notes & Evidence
              </Label>
              <Textarea
                id="effectivenessNotes"
                {...register("effectivenessNotes")}
                placeholder="Document verification findings, evidence collected, and any observations..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Submitting..."
                  : verificationPassed === false
                  ? "Submit & Trigger Re-CAPA"
                  : "Submit Verification"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
