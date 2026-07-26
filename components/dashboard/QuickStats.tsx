import {
  Wrench,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";

import DashboardCard from "./DashboardCard";

export default function QuickStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <DashboardCard
        title="Today's Tickets"
        value="12"
        icon={Wrench}
        color="bg-blue-600"
      />

      <DashboardCard
        title="Revenue"
        value="₦0"
        icon={DollarSign}
        color="bg-green-600"
      />

      <DashboardCard
        title="Waiting"
        value="3"
        icon={Clock}
        color="bg-amber-500"
      />

      <DashboardCard
        title="Completed"
        value="8"
        icon={CheckCircle}
        color="bg-emerald-600"
      />

    </div>
  );
}