export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";

import { ticketService } from "@/services/ticketService";
import PrintButton from "@/components/tickets/PrintButton";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TicketPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await ticketService.getTicketById(id);

  if (error || !data) {
    notFound();
  }

  const repair = Array.isArray(data.repairs) ? data.repairs[0] : data.repairs;
  const device = Array.isArray(repair?.devices)
    ? repair.devices[0]
    : repair?.devices;
  const customer = Array.isArray(device?.customers)
    ? device.customers[0]
    : device?.customers;

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
            <h1 className="text-2xl font-bold">Novatech Repair Suite</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pickup Ticket
            </p>
            <p className="text-3xl font-bold mt-4 tracking-wide">
              {data.ticket_number}
            </p>
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
              <p className="font-medium">
                {device?.brand} {device?.model}
              </p>
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
              <p className="font-medium">
                ₦{repair?.estimated_cost ?? "0"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Deposit Paid</p>
              <p className="font-medium">₦{repair?.deposit ?? "0"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Final Cost</p>
              <p className="font-bold text-lg">
                ₦{repair?.final_cost ?? "0"}
              </p>
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