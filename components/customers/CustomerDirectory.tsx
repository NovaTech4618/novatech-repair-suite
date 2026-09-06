"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Users, UserRound, Pencil, Trash2, ExternalLink, RotateCw } from "lucide-react";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { refreshKey: number; onEdit: (customer: Customer) => void };

export default function CustomerDirectory({ refreshKey, onEdit }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: serviceError } = await customerService.getCustomers();
    if (serviceError) {
      setError(serviceError.message || "Unable to load customers.");
      setCustomers([]);
    } else setCustomers(data || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [refreshKey]);

  async function remove(id: string) {
    if (!confirm("Delete this customer? This action cannot be undone.")) return;
    setDeletingId(id);
    const { error: deleteError } = await customerService.deleteCustomer(id);
    if (deleteError) toast.error(deleteError.message);
    else {
      toast.success("Customer deleted successfully.");
      setCustomers((current) => current.filter((customer) => customer.id !== id));
    }
    setDeletingId(null);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      customer.full_name.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query) ||
      (customer.email || "").toLowerCase().includes(query)
    );
  }, [customers, search]);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"><Users className="size-5" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold text-slate-950">Customer directory</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{customers.length}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Search, edit, or open a customer's full profile.</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading} className="h-9 rounded-lg border-slate-200 px-3 text-xs font-semibold">
            <RotateCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input aria-label="Search customers" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-slate-200 pl-9 shadow-none focus-visible:border-teal-600 focus-visible:ring-teal-600/20" />
        </div>
      </div>

      {error ? (
        <div className="m-5 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()} className="mt-3 rounded-lg">Try again</Button>
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5 sm:p-6">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound className="size-5" /></div>
          <h3 className="mt-4 font-heading font-semibold text-slate-900">{search ? "No matching customers" : "No customers yet"}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{search ? "Try a different name, phone number, or email." : "Add your first customer using the form to the left."}</p>
          {search && <Button variant="ghost" onClick={() => setSearch("")} className="mt-3 text-teal-700 hover:text-teal-800">Clear search</Button>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Email</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><Link href={`/customers/${customer.id}`} className="group flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{customer.full_name.trim().charAt(0).toUpperCase() || "?"}</span><span><span className="block font-semibold text-slate-900 group-hover:text-teal-700">{customer.full_name}</span><span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">View profile <ExternalLink className="size-3" /></span></span></Link></td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{customer.phone}</td>
                  <td className="max-w-[220px] truncate px-5 py-4 text-slate-600">{customer.email || <span className="text-slate-400">Not provided</span>}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => onEdit(customer)} className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"><Pencil className="mr-1.5 size-3.5" />Edit</Button><Button type="button" variant="ghost" size="sm" onClick={() => void remove(customer.id)} disabled={deletingId === customer.id} className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="size-3.5" /><span className="sr-only">Delete {customer.full_name}</span></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
