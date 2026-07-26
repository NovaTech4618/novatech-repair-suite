import QuickStats from "@/components/dashboard/QuickStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Dashboard
      </h1>

      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity />
        <LowStock />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>
    </div>
  );
}