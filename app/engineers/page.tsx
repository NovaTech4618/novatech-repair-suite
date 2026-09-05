"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { engineerService } from "@/services/engineerService";
import { inventoryService } from "@/services/inventoryService";
import type { Engineer, EngineerBalance, EngineerTransaction } from "@/types/engineer";
import type { InventoryItem } from "@/types/inventory";

const money = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const transactionLabel: Record<string, string> = {
  parts_out: "Parts collected",
  parts_in: "Parts returned",
  payment_in: "Payment received",
  payment_out: "Payment to engineer",
  opening_balance: "Opening balance",
  adjustment_debit: "Debit adjustment",
  adjustment_credit: "Credit adjustment",
};

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [balances, setBalances] = useState<EngineerBalance[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<EngineerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"parts" | "payment" | null>(null);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const balanceMap = useMemo(
    () => new Map(balances.map((item) => [item.engineer_id, item])),
    [balances]
  );

  const selectedEngineer = engineers.find((engineer) => engineer.id === selectedId);
  const selectedBalance = selectedId ? balanceMap.get(selectedId) : undefined;

  async function load() {
    setLoading(true);
    setError("");
    const [engineersRes, balancesRes, inventoryRes] = await Promise.all([
      engineerService.getEngineers(),
      engineerService.getBalances(),
      inventoryService.getInventory(),
    ]);

    if (engineersRes.error) setError(engineersRes.error.message);
    else setEngineers((engineersRes.data ?? []) as Engineer[]);
    if (balancesRes.error) setError(balancesRes.error.message);
    else setBalances((balancesRes.data ?? []) as EngineerBalance[]);
    if (inventoryRes.error) setError(inventoryRes.error.message);
    else setInventory((inventoryRes.data ?? []) as InventoryItem[]);
    setLoading(false);
  }

  async function selectEngineer(id: string) {
    setSelectedId(id);
    setAction(null);
    setMessage("");
    setError("");
    setDetailLoading(true);
    const result = await engineerService.getTransactions(id);
    if (result.error) setError(result.error.message);
    else setTransactions((result.data ?? []) as EngineerTransaction[]);
    setDetailLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function resetAction() {
    setAction(null);
    setInventoryId("");
    setQuantity(1);
    setUnitPrice("");
    setAmount("");
    setPaymentMethod("cash");
    setNotes("");
  }

  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    setMessage("");

    let result;
    if (action === "parts") {
      if (!inventoryId || quantity < 1) {
        setError("Select a part and enter a valid quantity.");
        setSaving(false);
        return;
      }
      result = await engineerService.recordPartsOut(
        selectedId,
        inventoryId,
        quantity,
        unitPrice ? Number(unitPrice) : undefined,
        notes.trim() || null
      );
    } else {
      const value = Number(amount);
      if (!value || value <= 0) {
        setError("Enter a valid payment amount.");
        setSaving(false);
        return;
      }
      result = await engineerService.recordPaymentIn(
        selectedId,
        value,
        paymentMethod,
        notes.trim() || null
      );
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setMessage(action === "parts" ? "Parts collection recorded successfully." : "Payment recorded successfully.");
    resetAction();
    await Promise.all([load(), selectEngineer(selectedId)]);
    setSaving(false);
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading engineers...</div>;

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Engineers</h1>
          <p className="text-muted-foreground">Track contract technicians, parts collected, returns and payments.</p>
        </div>
        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Back to dashboard</Link>
      </div>

      {error && <div className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-md border p-3 text-sm">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section className="rounded-xl border">
          <div className="border-b p-5">
            <h2 className="font-semibold">Engineer accounts</h2>
            <p className="text-sm text-muted-foreground">Balance = debit minus credit.</p>
          </div>
          <div className="divide-y">
            {engineers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No engineers found.</div>
            ) : engineers.map((engineer) => {
              const balance = balanceMap.get(engineer.id);
              return (
                <button
                  key={engineer.id}
                  type="button"
                  onClick={() => void selectEngineer(engineer.id)}
                  className={`w-full p-5 text-left transition hover:bg-muted/50 ${selectedId === engineer.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{engineer.name}</p>
                      <p className="text-sm text-muted-foreground">{engineer.phone || engineer.business_name || "No contact details"}</p>
                    </div>
                    <span className={`font-semibold ${Number(balance?.balance ?? 0) > 0 ? "text-destructive" : ""}`}>
                      {money(Number(balance?.balance ?? 0))}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{engineer.status}</span>
                    <span>{Number(balance?.total_debit ?? 0) > 0 ? `${money(Number(balance?.total_debit))} debits` : "No activity"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border">
          {!selectedEngineer ? (
            <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-muted-foreground">
              Select an engineer to view their ledger.
            </div>
          ) : (
            <>
              <div className="border-b p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedEngineer.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedEngineer.phone || "No phone number"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current balance</p>
                    <p className={`text-2xl font-bold ${Number(selectedBalance?.balance ?? 0) > 0 ? "text-destructive" : ""}`}>
                      {money(Number(selectedBalance?.balance ?? 0))}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setAction("parts")} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Record parts collected</button>
                  <button type="button" onClick={() => setAction("payment")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Record payment</button>
                </div>
              </div>

              {action && (
                <form onSubmit={submitAction} className="border-b bg-muted/30 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">{action === "parts" ? "Record parts collected" : "Record payment from engineer"}</h3>
                    <button type="button" onClick={resetAction} className="text-sm text-muted-foreground">Cancel</button>
                  </div>
                  {action === "parts" ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="text-sm md:col-span-2">Part<select value={inventoryId} onChange={(e) => { setInventoryId(e.target.value); const item = inventory.find((x) => x.id === e.target.value); setUnitPrice(item ? String(item.selling_price) : ""); }} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="">Select part</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.item_name} — {money(item.selling_price)} (stock: {item.quantity})</option>)}</select></label>
                      <label className="text-sm">Quantity<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
                      <label className="text-sm">Unit price<input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
                      <label className="text-sm md:col-span-2">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="text-sm">Amount<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
                      <label className="text-sm">Payment method<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>
                      <label className="text-sm">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
                    </div>
                  )}
                  <button disabled={saving} type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save transaction"}</button>
                </form>
              )}

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Transaction history</h3>
                  <span className="text-sm text-muted-foreground">{transactions.length} transactions</span>
                </div>
                {detailLoading ? <p className="py-8 text-center text-muted-foreground">Loading ledger...</p> : transactions.length === 0 ? <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">No transactions yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Credit</th><th className="p-3 text-right">Balance</th></tr></thead>
                      <tbody>
                        {[...transactions].reverse().map((transaction, index, chronological) => {
                          const running = chronological.slice(0, index + 1).reduce((sum, row) => sum + Number(row.debit) - Number(row.credit), 0);
                          return <tr key={transaction.id} className="border-b last:border-0"><td className="p-3 whitespace-nowrap">{new Date(transaction.transaction_date).toLocaleDateString()}</td><td className="p-3">{transaction.description}</td><td className="p-3">{transactionLabel[transaction.transaction_type] ?? transaction.transaction_type}</td><td className="p-3 text-right">{Number(transaction.debit) ? money(Number(transaction.debit)) : "—"}</td><td className="p-3 text-right">{Number(transaction.credit) ? money(Number(transaction.credit)) : "—"}</td><td className="p-3 text-right font-medium">{money(running)}</td></tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
