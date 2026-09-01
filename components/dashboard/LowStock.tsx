"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Package,
  ArrowDownToLine,
} from "lucide-react";

 
import { inventoryService } from "@/services/inventoryService";
type LowStockItem = {
  id: string;
  item_name: string;
  quantity: number;
  minimum_stock: number;
};

export default function LowStock() {
 const [items, setItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    fetchLowStock();
  }, []);

  async function fetchLowStock() {
     

    const { data } = await inventoryService.getLowStock();

    setItems((data || []).slice(0, 5));
  }

  return (
    <div
      className="
        glass-panel
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--novatech-border)]
        p-5
        shadow-[var(--novatech-shadow-glass)]
        transition-all
        duration-300
        hover:shadow-[var(--novatech-shadow-glow)]
        sm:p-6
      "
    >
      {/* Scan line */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          -translate-x-full
          bg-gradient-to-r
          from-transparent
          via-[var(--novatech-copper)]
          to-transparent
          opacity-0
          transition-all
          duration-700
          group-hover:translate-x-full
          group-hover:opacity-80
        "
      />

      {/* Header */}
      <div className="relative mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              size-10
              items-center
              justify-center
              rounded-2xl
              bg-[var(--novatech-copper)]/10
              text-[var(--novatech-copper)]
            "
          >
            <AlertTriangle size={19} />
          </div>

          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Inventory Monitor
            </p>

            <h2 className="mt-1 font-heading text-lg font-semibold">
              Low Stock Alert
            </h2>
          </div>
        </div>

        <div className="rounded-full border border-[var(--novatech-copper)]/20 bg-[var(--novatech-copper)]/10 px-2.5 py-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--novatech-copper)]">
            Risk
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="
            flex
            min-h-40
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-[var(--novatech-primary)]/20
            bg-[var(--novatech-primary)]/[0.03]
            text-center
          "
        >
          <div
            className="
              mb-3
              flex
              size-10
              items-center
              justify-center
              rounded-xl
              bg-[var(--novatech-primary)]/10
              text-[var(--novatech-primary-light)]
            "
          >
            <Package size={18} />
          </div>

          <p className="text-sm font-medium">
            Stock levels are healthy
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            No items currently require attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="
                group/item
                flex
                items-center
                justify-between
                gap-4
                rounded-2xl
                border
                border-[var(--novatech-border)]
                bg-black/[0.03]
                p-4
                transition-all
                duration-200
                hover:bg-[var(--novatech-surface-alt)]
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    flex
                    size-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[var(--novatech-copper)]/10
                    text-[var(--novatech-copper)]
                  "
                >
                  <Package size={15} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.item_name}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <ArrowDownToLine
                      size={11}
                      className="text-muted-foreground"
                    />

                    <span className="text-xs text-muted-foreground">
                      Stock level critical
                    </span>
                  </div>
                </div>
              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  border
                  border-[var(--novatech-copper)]/30
                  bg-[var(--novatech-copper)]/10
                  px-2.5
                  py-1
                  font-mono
                  text-[10px]
                  font-semibold
                  text-[var(--novatech-copper)]
                "
              >
                {item.quantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}