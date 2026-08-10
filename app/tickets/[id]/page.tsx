"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/lib/supabase";
import { ticketService } from "@/services/ticketService";
import PrintButton from "@/components/tickets/PrintButton";
import { Card, CardContent } from "@/components/ui/card";

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  async function fetchTicket() {
    await getCurrentSession();

    const { data, error } = await ticketService.getTicketById(params.id);

    setLoading(false);

    if (error || !data) {
      setNotFound(true);
      return;
    }

    setData(data);
  }

  if (loading) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  if (notFound || !data) {
    return <p className="p-6 text-gray-500">Ticket not found.</p>;
  }

  const repair = Array.isArray(data.repairs) ? data.repairs[0] : data.repairs;
  const device = Array.isArray(repair?.devices) ? repair.devices[0] : repair?.devices;
  const customer = Array.isArray(device?.customers) ? device.customers[0] : device?.customers;
  const company = Array.isArray(repair?.companies) ? repair.companies[0] : repair?.companies;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/devices" className="text-blue-600 hover:underline">
          ← Back
        </Link>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold">{company?.name || "Repair Shop"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Pickup Ticket</p>
            <p className="text-3xl font-bold mt-4 tracking-wide">{data.ticket_number}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Issued {new Date(data.issued_at).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{customer?.full_name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{customer?.phone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Device</p>
              <p className="font-medium">{device?.brand} {device?.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Serial Number</p>
              <p className="font-medium">{device?.serial_number || "-"}</p>
            </div>
          </div>

          <hr />

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Issue</p>
              <p className="font-medium">{repair?.issue}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Solution</p>
              <p className="font-medium">{repair?.solution || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Technician</p>
              <p className="font-medium">{repair?.technician || "-"}</p>
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Estimated Cost</p>
              <p className="font-medium">₦{repair?.estimated_cost ?? "0"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deposit Paid</p>
              <p className="font-medium">₦{repair?.deposit ?? "0"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Final Cost</p>
              <p className="font-bold text-lg">₦{repair?.final_cost ?? "0"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance Due</p>
              <p className="font-bold text-lg">
                ₦{(repair?.final_cost ?? 0) - (repair?.deposit ?? 0)}
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-6 border-t">
            Please present this ticket to collect your device.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}