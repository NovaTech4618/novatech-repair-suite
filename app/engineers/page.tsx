"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { engineerService } from "@/services/engineerService";
import { inventoryService } from "@/services/inventoryService";
import type { Engineer, EngineerBalance, EngineerTransaction, EngineerInput } from "@/types/engineer";
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

const emptyEngineer: EngineerInput = { name: "", phone: "", business_name: "", address: "", notes: "" };
type Action = "parts" | "return" | "payment" | "payment-out" | "opening" | null;
type Period = "all" | "day" | "week" | "month" | "year";

function periodStart(period: Period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "day") return start;
  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start;
  }
  if (period === "month") {
    start.setDate(1);
    return start;
  }
  if (period === "year") {
    start.setMonth(0, 1);
    return start;
  }
  return null;
}

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
  const [action, setAction] = useState<Action>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [showEngineerForm, setShowEngineerForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [engineerForm, setEngineerForm] = useState<EngineerInput>(emptyEngineer);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const balanceMap = useMemo(() => new Map(balances.map((item) => [item.engineer_id, item])), [balances]);
  const selectedEngineer = engineers.find((engineer) => engineer.id === selectedId);
  const selectedBalance = selectedId ? balanceMap.get(selectedId) : undefined;

  const filteredTransactions = useMemo(() => {
    const start = periodStart(period);
    if (!start) return transactions;
    return transactions.filter((transaction) => new Date(transaction.transaction_date) >= start);
  }, [transactions, period]);

  const debitTransactions = useMemo(
    () => filteredTransactions.filter((transaction) => Number(transaction.debit) > 0),
    [filteredTransactions],
  );

  const debitTotal = useMemo(
    () => debitTransactions.reduce((sum, transaction) => sum + Number(transaction.debit || 0), 0),
    [debitTransactions],
  );

  const periodLabel = period === "all" ? "All time" : period === "day" ? "Today" : period === "week" ? "This week" : period === "month" ? "This month" : "This year";

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

  function openCreate() {
    setEditingEngineer(null);
    setEngineerForm(emptyEngineer);
    setShowEngineerForm(true);
    setError("");
    setMessage("");
  }

  function openEdit(engineer: Engineer) {
    setEditingEngineer(engineer);
    setEngineerForm({
      name: engineer.name,
      phone: engineer.phone ?? "",
      business_name: engineer.business_name ?? "",
      address: engineer.address ?? "",
      notes: engineer.notes ?? "",
    });
    setShowEngineerForm(true);
    setError("");
    setMessage("");
  }

  async function submitEngineer(event: React.FormEvent) {
    event.preventDefault();
    if (!engineerForm.name?.trim()) {
      setError("Engineer name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const result = editingEngineer
      ? await engineerService.updateEngineer(editingEngineer.id, engineerForm)
      : await engineerService.createEngineer(engineerForm);
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    const saved = result.data as Engineer;
    setShowEngineerForm(false);
    setEngineerForm(emptyEngineer);
    setMessage(editingEngineer ? "Engineer updated successfully." : "Engineer added successfully.");
    await load();
    if (saved?.id) await selectEngineer(saved.id);
    setSaving(false);
  }

  async function toggleStatus(engineer: Engineer) {
    const nextStatus = engineer.status === "active" ? "inactive" : "active";
    setSaving(true);
    setError("");
    setMessage("");
    const result = await engineerService.setEngineerStatus(engineer.id, nextStatus);
    if (result.error) setError(result.error.message);
    else {
      setMessage(`${engineer.name} is now ${nextStatus}.`);
      await load();
    }
    setSaving(false);
  }

  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !action) return;
    setSaving(true);
    setError("");
    setMessage("");

    let result;
    if (action === "parts" || action === "return") {
      if (!inventoryId || quantity < 1) {
        setError("Select a part and enter a valid quantity.");
        setSaving(false);
        return;
      }
      const price = Number(unitPrice);
      if (!Number.isFinite(price) || price < 0) {
        setError("Enter a valid unit price.");
        setSaving(false);
        return;
      }
      result = action === "parts"
        ? await engineerService.recordPartsOut(selectedId, inventoryId, quantity, price, notes.trim() || null)
        : await engineerService.recordPartsIn(selectedId, inventoryId, quantity, price, notes.trim() || null);
    } else if (action === "payment" || action === "payment-out") {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Enter a valid payment amount.");
        setSaving(false);
        return;
      }
      result = action === "payment"
        ? await engineerService.recordPaymentIn(selectedId, value, paymentMethod, notes.trim() || null)
        : await engineerService.recordPaymentOut(selectedId, value, paymentMethod, notes.trim() || null);
    } else {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Enter a valid opening balance.");
        setSaving(false);
        return;
      }
      result = await engineerService.recordOpeningBalance(selectedId, value, notes.trim() || null);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    const successMessage =
      action === "parts"
        ? "Parts collection recorded successfully."
        : action === "return"
          ? "Parts return recorded successfully. Inventory and engineer balance have been updated."
          : action === "payment"
            ? "Payment received from engineer recorded successfully."
            : action === "payment-out"
              ? "Payment to engineer recorded successfully. Engineer balance has been updated."
              : "Opening balance recorded successfully.";
    setMessage(successMessage);
    resetAction();
    await Promise.all([load(), selectEngineer(selectedId)]);
    setSaving(false);
  }

  function downloadDebitPdf() {
    if (!selectedEngineer || debitTransactions.length === 0) {
      setMessage("There are no debit transactions in the selected period to export.");
      return;
    }
    window.print();
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading engineers...</div>;

  return (
    <main className="space-y-6 p-6">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .engineer-debit-report, .engineer-debit-report * { visibility: visible !important; }
          .engineer-debit-report { position: absolute; inset: 0; width: 100%; padding: 24px; background: white; color: black; }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Engineers</h1>
          <p className="text-muted-foreground">Track contract technicians, parts collected, returns and payments.</p>
        </div>
        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Back to dashboard</Link>
      </div>

      {error && <div className="rounded-md border border-destructive/30 p-3 text-sm text-destructive print:hidden">{error}</div>}
      {message && <div className="rounded-md border p-3 text-sm print:hidden">{message}</div>}

      <section className="engineer-debit-report hidden print:block">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">NOVATECH — Engineer Debit Statement</h1>
          <p className="mt-1 text-lg font-semibold">Engineer: {selectedEngineer?.name ?? ""}</p>
          <p>Period: {periodLabel}</p>
          {selectedEngineer?.phone && <p>Phone: {selectedEngineer.phone}</p>}
        </div>
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="rounded border p-3"><p className="text-xs">Debit transactions</p><p className="text-xl font-bold">{debitTransactions.length}</p></div>
          <div className="rounded border p-3"><p className="text-xs">Period debit</p><p className="text-xl font-bold">{money(debitTotal)}</p></div>
          <div className="rounded border p-3"><p className="text-xs">Current outstanding balance</p><p className="text-xl font-bold">{money(Number(selectedBalance?.balance ?? 0))}</p></div>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b-2"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Type</th><th className="p-2 text-right">Debit</th></tr></thead>
          <tbody>{debitTransactions.map((transaction) => <tr key={transaction.id} className="border-b"><td className="p-2">{new Date(transaction.transaction_date).toLocaleDateString()}</td><td className="p-2">{transaction.description}</td><td className="p-2">{transactionLabel[transaction.transaction_type] ?? transaction.transaction_type}</td><td className="p-2 text-right">{money(Number(transaction.debit))}</td></tr>)}</tbody>
        </table>
        <div className="mt-8 border-t pt-4 text-xs">Generated from NOVATECH Repair Suite • {new Date().toLocaleString()}</div>
      </section>

      {showEngineerForm && (
        <form onSubmit={submitEngineer} className="rounded-xl border bg-muted/20 p-5 print:hidden">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-semibold">{editingEngineer ? "Edit engineer" : "Add engineer"}</h2><p className="text-sm text-muted-foreground">Account history is preserved when an engineer is deactivated.</p></div>
            <button type="button" onClick={() => setShowEngineerForm(false)} className="text-sm text-muted-foreground">Cancel</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">Name *<input required value={engineerForm.name ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, name: e.target.value })} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
            <label className="text-sm">Phone<input value={engineerForm.phone ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, phone: e.target.value })} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
            <label className="text-sm">Business name<input value={engineerForm.business_name ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, business_name: e.target.value })} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
            <label className="text-sm">Address<input value={engineerForm.address ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, address: e.target.value })} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
            <label className="text-sm md:col-span-2">Notes<textarea value={engineerForm.notes ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>
          </div>
          <button disabled={saving} type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : editingEngineer ? "Save changes" : "Add engineer"}</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] print:hidden">
        <section className="rounded-xl border">
          <div className="flex items-center justify-between gap-3 border-b p-5"><div><h2 className="font-semibold">Engineer accounts</h2><p className="text-sm text-muted-foreground">Balance = debit minus credit.</p></div><button type="button" onClick={openCreate} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">+ Add Engineer</button></div>
          <div className="divide-y">
            {engineers.length === 0 ? <div className="p-8 text-center text-muted-foreground">No engineers found.</div> : engineers.map((engineer) => {
              const balance = balanceMap.get(engineer.id);
              return <div key={engineer.id} className={`p-4 transition hover:bg-muted/50 ${selectedId === engineer.id ? "bg-muted" : ""}`}><div className="flex items-start gap-3"><button type="button" onClick={() => void selectEngineer(engineer.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{engineer.name}</p><p className="text-sm text-muted-foreground">{engineer.phone || engineer.business_name || "No contact details"}</p></div><span className={`font-semibold ${Number(balance?.balance ?? 0) > 0 ? "text-destructive" : ""}`}>{money(Number(balance?.balance ?? 0))}</span></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span className="capitalize">{engineer.status}</span><span>{Number(balance?.total_debit ?? 0) > 0 ? `${money(Number(balance?.total_debit))} debits` : "No activity"}</span></div></button><div className="flex shrink-0 gap-1"><button type="button" onClick={() => openEdit(engineer)} className="rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted">Edit</button><button disabled={saving} type="button" onClick={() => void toggleStatus(engineer)} className="rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50">{engineer.status === "active" ? "Deactivate" : "Activate"}</button></div></div></div>;
            })}
          </div>
        </section>

        <section className="rounded-xl border">
          {!selectedEngineer ? <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-muted-foreground">Select an engineer to view their ledger.</div> : <>
            <div className="border-b p-5">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{selectedEngineer.name}</h2><p className="text-sm text-muted-foreground">{selectedEngineer.phone || "No phone number"}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Current balance</p><p className={`text-2xl font-bold ${Number(selectedBalance?.balance ?? 0) > 0 ? "text-destructive" : ""}`}>{money(Number(selectedBalance?.balance ?? 0))}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setAction("parts")} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Record parts collected</button><button type="button" onClick={() => setAction("return")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Record parts returned</button><button type="button" onClick={() => setAction("payment")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Receive payment</button><button type="button" onClick={() => setAction("payment-out")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Pay engineer</button><button type="button" onClick={() => setAction("opening")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Opening balance</button></div>
            </div>

            {action && <form onSubmit={submitAction} className="border-b bg-muted/30 p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">{action === "parts" ? "Record parts collected" : action === "return" ? "Record parts returned" : action === "payment" ? "Receive payment from engineer" : action === "payment-out" ? "Pay engineer" : "Set opening balance"}</h3>{action === "return" && <p className="mt-1 text-xs text-muted-foreground">Returned stock is added back to inventory and credited to the engineer account.</p>}{action === "payment-out" && <p className="mt-1 text-xs text-muted-foreground">This records money paid by the shop to the engineer and reduces the engineer&apos;s outstanding balance.</p>}</div><button type="button" onClick={resetAction} className="text-sm text-muted-foreground">Cancel</button></div>
              {(action === "parts" || action === "return") ? <div className="grid gap-4 md:grid-cols-3"><label className="text-sm md:col-span-2">Part<select value={inventoryId} onChange={(e) => { setInventoryId(e.target.value); const item = inventory.find((x) => x.id === e.target.value); setUnitPrice(item ? String(item.selling_price) : ""); }} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="">Select part</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.item_name} — {money(item.selling_price)} (stock: {item.quantity})</option>)}</select></label><label className="text-sm">Quantity<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label><label className="text-sm">Unit price<input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5" /></label><label className="text-sm md:col-span-2">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label></div> : <div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Amount<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label>{(action === "payment" || action === "payment-out") && <label className="text-sm">Payment method<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2.5"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>}<label className="text-sm md:col-span-2">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-md border bg-background p-2.5" /></label></div>}
              <button disabled={saving} type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : action === "payment-out" ? "Record payment to engineer" : action === "payment" ? "Record payment received" : "Save transaction"}</button>
            </form>}

            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Transaction history</h3><span className="text-sm text-muted-foreground">{filteredTransactions.length} of {transactions.length} transactions</span></div><div className="flex flex-wrap gap-2"><select aria-label="Filter transaction period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="all">All time</option><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option></select><button type="button" onClick={downloadDebitPdf} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Download debit PDF</button></div></div>
              <div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Period</p><p className="font-semibold">{periodLabel}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Period debits</p><p className="font-semibold">{money(debitTotal)}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Current balance</p><p className="font-semibold">{money(Number(selectedBalance?.balance ?? 0))}</p></div></div>
              {detailLoading ? <p className="py-8 text-center text-muted-foreground">Loading ledger...</p> : filteredTransactions.length === 0 ? <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">No transactions in this period.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Credit</th><th className="p-3 text-right">Balance</th></tr></thead><tbody>{[...filteredTransactions].reverse().map((transaction, index, chronological) => { const running = chronological.slice(0, index + 1).reduce((sum, row) => sum + Number(row.debit) - Number(row.credit), 0); return <tr key={transaction.id} className="border-b last:border-0"><td className="whitespace-nowrap p-3">{new Date(transaction.transaction_date).toLocaleDateString()}</td><td className="p-3">{transaction.description}</td><td className="p-3">{transactionLabel[transaction.transaction_type] ?? transaction.transaction_type}</td><td className="p-3 text-right">{Number(transaction.debit) ? money(Number(transaction.debit)) : "—"}</td><td className="p-3 text-right">{Number(transaction.credit) ? money(Number(transaction.credit)) : "—"}</td><td className="p-3 text-right font-medium">{money(running)}</td></tr>; })}</tbody></table></div>}
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
