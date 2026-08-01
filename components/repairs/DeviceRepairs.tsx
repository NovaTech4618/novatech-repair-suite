"use client";

import { useState } from "react";

import RepairForm from "./RepairForm";
import RepairTable from "./RepairTable";

type Props = {
  deviceId: string;
};

export default function DeviceRepairs({ deviceId }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRepairAdded() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <RepairForm deviceId={deviceId} onRepairAdded={handleRepairAdded} />
      <RepairTable deviceId={deviceId} refreshKey={refreshKey} />
    </div>
  );
}