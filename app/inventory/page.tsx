"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import ReceiveStockPanel from "@/components/inventory/ReceiveStockPanel";
import TransferStockPanel from "@/components/inventory/TransferStockPanel";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryItem } from "@/types/inventory";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0); const [editingItem,setEditingItem]=useState<InventoryItem|null>(null); const[items,setItems]=useState<InventoryItem[]>([]); const[query,setQuery]=useState(""); const[stockFilter,setStockFilter]=useState("all");
  useEffect(()=>{inventoryService.getInventory().then(r=>{if(!r.error)setItems((r.data??[])as InventoryItem[])})},[refreshKey]);
  const filtered=useMemo(()=>items.filter(item=>{const text=`${item.item_name} ${item.brand??""} ${item.sku??""} ${item.shelf_location??""}`.toLowerCase();return text.includes(query.toLowerCase())&&(stockFilter==="all"||(stockFilter==="low"?item.quantity<=item.minimum_stock:item.quantity===0))}),[items,query,stockFilter]);
  const lowStock=items.filter(i=>i.quantity<=i.minimum_stock),saveRefresh=()=>setRefreshKey(v=>v+1);
  return <AppLayout><div className="space-y-6"><header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Workshop stockroom</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Inventory</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Find parts, receive supplier stock, transfer between branches and keep the repair bench supplied.</p></div><Link href="/inventory/movements" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50">Stock movements & transfers</Link></header>
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 md:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search part, SKU, brand or shelf..." className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"/><select value={stockFilter} onChange={e=>setStockFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="all">All stock</option><option value="low">Low stock</option><option value="empty">Out of stock</option></select></div><div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-500"><span><strong className="text-slate-900">{items.length}</strong> parts</span><span><strong className="text-amber-700">{lowStock.length}</strong> need attention</span><span><strong className="text-slate-900">{filtered.length}</strong> shown</span></div></section>
  {lowStock.length>0&&<section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><h2 className="font-semibold text-amber-950">Parts need attention</h2><p className="mt-1 text-sm text-amber-800">These items are at or below their minimum stock level.</p><div className="mt-3 flex flex-wrap gap-2">{lowStock.slice(0,8).map(i=><span key={i.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">{i.item_name} · {i.quantity} left</span>)}</div></section>}
  <section className="grid gap-6 xl:grid-cols-4"><InventoryForm editingItem={editingItem} onSaved={()=>{setEditingItem(null);saveRefresh()}} onCancelEdit={()=>setEditingItem(null)}/><ReceiveStockPanel refreshKey={refreshKey} onReceived={saveRefresh}/><PurchaseStockPanel items={items} onSaved={saveRefresh}/><TransferStockPanel items={items} onTransferred={saveRefresh}/></section>
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Parts on hand</h2><p className="mt-1 text-sm text-slate-500">Stock available for repairs and sales.</p></div><InventoryTable refreshKey={refreshKey} onEdit={setEditingItem} itemsOverride={filtered} embedded/></section></div></AppLayout>;
}
