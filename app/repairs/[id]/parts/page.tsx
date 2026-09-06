"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import RepairPartsPanel from "@/components/repairs/RepairPartsPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RepairPartsPage() {
  const params = useParams<{ id: string }>();
  const repairId = params.id;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-1 sm:space-y-6 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Repair Parts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Issue parts to this repair, return unused parts, and keep inventory and COGS accurate.
            </p>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/repairs" />}
          >
            Back to Repairs
          </Button>
        </div>
        <RepairPartsPanel repairId={repairId} />
      </div>
    </AppLayout>
  );
}
