"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { getCurrentSession } from "@/lib/supabase";
import { reportsService } from "@/services/reportsService";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Period = "today" | "week" | "month" | "all";

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (period === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return null;
}

const selectClassName =
  "h-8 rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none";

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await getCurrentSession();

    const [salesRes, repairsRes, lowStockRes] = await Promise.all([
      reportsService.getSalesWithItems(),
      reportsService.getRepairsForReports(),
      reportsService.getLowStockItems(),
    ]);

    if (salesRes.error || repairsRes.error) {
      toast.error("Failed to load report data.");
    }

    setSales(salesRes.data || []);
    setRepairs(repairsRes.data || []);

    const low = (lowStockRes.data || []).filter(
      (i: any) => i.quantity <= i.minimum_stock
    );
    setLowStock(low);

    setLoading(false);
  }

  const start = periodStart(period);

  const filteredSales = useMemo(() => {
    if (!start) return sales;
    return sales.filter((s) => new Date(s.sale_date) >= start);
  }, [sales, start]);

  const filteredRepairs = useMemo(() => {
    if (!start) return repairs;
    return repairs.filter((r) => new Date(r.created_at) >= start);
  }, [repairs, start]);

  const salesStats = useMemo(() => {
    let revenue = 0;
    let cost = 0;

    for (const sale of filteredSales) {
      revenue += sale.total || 0;

      for (const item of sale.sale_items || []) {
        const inv = Array.isArray(item.inventory)
          ? item.inventory[0]
          : item.inventory;
        cost += (inv?.cost_price || 0) * item.quantity;
      }
    }

    return { revenue, cost, profit: revenue - cost };
  }, [filteredSales]);

  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const sale of filteredSales) {
      for (const item of sale.sale_items || []) {
        const inv = Array.isArray(item.inventory)
          ? item.inventory[0]
          : item.inventory;
        const name = inv?.item_name || "Unknown item";
        const existing = map.get(name) || { name, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.total_price;
        map.set(name, existing);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSales]);

  const repairStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let repairRevenue = 0;

    for (const r of filteredRepairs) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.status === "Completed" || r.status === "Collected") {
        repairRevenue += r.final_cost || 0;
      }
    }

    return { byStatus, repairRevenue, total: filteredRepairs.length };
  }, [filteredRepairs]);

  // The one number the whole business actually cares about: what did we
  // make, full stop, combining both revenue streams.
  const totalRevenue = salesStats.revenue + repairStats.repairRevenue;

  if (loading) {
    return (
      <AppLayout>
        <p className="text-gray-500">Loading reports...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>

          <select
            className={selectClassName}
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <Card className="border-2 border-primary/30">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Total Business Revenue</p>
            <p className="mt-2 font-heading text-4xl font-bold text-primary">
              ₦{totalRevenue.toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sales + completed repairs, combined
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Sales Revenue</p>
              <p className="mt-2 text-3xl font-bold">₦{salesStats.revenue.toFixed(0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Sales Profit</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                ₦{salesStats.profit.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Repair Revenue</p>
              <p className="mt-2 text-3xl font-bold">₦{repairStats.repairRevenue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Best-Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              {bestSellers.length === 0 ? (
                <p className="text-sm text-gray-500">No sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {bestSellers.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{item.qty} sold</p>
                        <p className="text-muted-foreground">₦{item.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repairs by Status ({repairStats.total} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(repairStats.byStatus).length === 0 ? (
                <p className="text-sm text-gray-500">No repairs in this period.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(repairStats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant="glass">{status}</Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Risk — Low or Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">All stock levels are healthy.</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{item.item_name}</span>
                    <Badge variant="destructive">
                      {item.quantity} left (min {item.minimum_stock})
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}