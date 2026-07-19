"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deviceService } from "@/services/deviceService";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DeviceFormProps = {
  customerId: string;
  onDeviceAdded: () => void;
};

export default function DeviceForm({
  customerId,
  onDeviceAdded,
}: DeviceFormProps) {
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [accessories, setAccessories] = useState("");
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !deviceType.trim() ||
      !brand.trim() ||
      !model.trim() ||
      !problem.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const { error } =
      await deviceService.addDevice({
        customer_id: customerId,
        device_type: deviceType,
        brand,
        model,
        serial_number: serialNumber,
        color,
        condition,
        accessories,
        problem,
      });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Device added successfully!");

    setDeviceType("");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setColor("");
    setCondition("");
    setAccessories("");
    setProblem("");

    onDeviceAdded();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Device</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            placeholder="Device Type"
            value={deviceType}
            onChange={(e) =>
              setDeviceType(e.target.value)
            }
          />

          <Input
            placeholder="Brand"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
          />

          <Input
            placeholder="Model"
            value={model}
            onChange={(e) =>
              setModel(e.target.value)
            }
          />

          <Input
            placeholder="IMEI / Serial Number"
            value={serialNumber}
            onChange={(e) =>
              setSerialNumber(e.target.value)
            }
          />

          <Input
            placeholder="Color"
            value={color}
            onChange={(e) =>
              setColor(e.target.value)
            }
          />

          <Input
            placeholder="Condition"
            value={condition}
            onChange={(e) =>
              setCondition(e.target.value)
            }
          />

          <Input
            placeholder="Accessories"
            value={accessories}
            onChange={(e) =>
              setAccessories(e.target.value)
            }
          />

          <Input
            placeholder="Problem Description"
            value={problem}
            onChange={(e) =>
              setProblem(e.target.value)
            }
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Save Device"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}