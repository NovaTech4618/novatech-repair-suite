"use client";

import { useState } from "react";
import { toast } from "sonner";

import { repairService } from "@/services/repairService";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RepairFormProps = {
  deviceId: string;
  onRepairAdded: () => void;
};

export default function RepairForm({
  deviceId,
  onRepairAdded,
}: RepairFormProps) {
  const [technician, setTechnician] = useState("");
  const [issue, setIssue] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [status, setStatus] = useState("Received");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!issue.trim()) {
      toast.error("Issue is required.");
      return;
    }

    setLoading(true);

    const { error } = await repairService.addRepair({
      device_id: deviceId,
      technician,
      issue,
      diagnosis,
      repair_notes: repairNotes,
      estimated_cost: estimatedCost
        ? Number(estimatedCost)
        : null,
      final_cost: finalCost
        ? Number(finalCost)
        : null,
      status,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Repair created successfully!");

    setTechnician("");
    setIssue("");
    setDiagnosis("");
    setRepairNotes("");
    setEstimatedCost("");
    setFinalCost("");
    setStatus("Received");

    onRepairAdded();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Repair</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            placeholder="Technician"
            value={technician}
            onChange={(e) =>
              setTechnician(e.target.value)
            }
          />

          <Input
            placeholder="Customer Complaint"
            value={issue}
            onChange={(e) =>
              setIssue(e.target.value)
            }
          />

          <Input
            placeholder="Diagnosis"
            value={diagnosis}
            onChange={(e) =>
              setDiagnosis(e.target.value)
            }
          />

          <Input
            placeholder="Repair Notes"
            value={repairNotes}
            onChange={(e) =>
              setRepairNotes(e.target.value)
            }
          />

          <Input
            type="number"
            placeholder="Estimated Cost"
            value={estimatedCost}
            onChange={(e) =>
              setEstimatedCost(e.target.value)
            }
          />

          <Input
            type="number"
            placeholder="Final Cost"
            value={finalCost}
            onChange={(e) =>
              setFinalCost(e.target.value)
            }
          />

          <Input
            placeholder="Status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Create Repair"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}