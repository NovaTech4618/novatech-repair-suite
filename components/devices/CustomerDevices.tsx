"use client";

import { useState } from "react";

import DeviceForm from "./DeviceForm";
import DeviceTable from "./DeviceTable";

type Props = {
  customerId: string;
};

export default function CustomerDevices({
  customerId,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDeviceAdded() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <DeviceForm
        customerId={customerId}
        onDeviceAdded={handleDeviceAdded}
      />

      <DeviceTable
        customerId={customerId}
        refreshKey={refreshKey}
      />
    </div>
  );
}