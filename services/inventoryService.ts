import { supabase } from "@/lib/supabase";
import type { InventoryItemInput } from "@/types/inventory";

export const inventoryService = {
  async getInventory() { return await supabase.from("inventory").select("*").order("item_name", { ascending: true }); },
  async getInventoryById(id: string) { return await supabase.from("inventory").select("*").eq("id", id).single(); },
  async getLowStock() { const { data,error }=await supabase.from("inventory").select("id,item_name,quantity,minimum_stock").order("quantity",{ascending:true}); if(error)return{data:null,error}; return{data:(data||[]).filter(i=>i.quantity<=i.minimum_stock).slice(0,5),error:null}; },
  async addInventoryItem(item: InventoryItemInput) { return await supabase.from("inventory").insert([item]); },
  async updateInventoryItem(id:string,item:InventoryItemInput) { return await supabase.from("inventory").update({...item,updated_at:new Date().toISOString()}).eq("id",id); },
  async deleteInventoryItem(id:string) { return await supabase.from("inventory").delete().eq("id",id); },
  async uploadItemImage(companyId:string,itemId:string,file:File) {
    if(!file.type.startsWith("image/")) return { data:null,error:new Error("Only image files are allowed.") };
    if(file.size>5*1024*1024) return { data:null,error:new Error("Image must be 5MB or smaller.") };
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=`${companyId}/${itemId}.${ext}`;
    const {error}=await supabase.storage.from("inventory-images").upload(path,file,{upsert:true,contentType:file.type,cacheControl:"3600"});
    if(error)return{data:null,error};
    const {data}=supabase.storage.from("inventory-images").getPublicUrl(path);
    const {error:updateError}=await supabase.from("inventory").update({image_url:data.publicUrl,updated_at:new Date().toISOString()}).eq("id",itemId);
    if(updateError)return{data:null,error:updateError};
    return{data:data.publicUrl,error:null};
  },
  async createInventoryTransfer(inventoryId:string,toBranchId:string,quantity:number,notes?:string|null){return await supabase.rpc("create_inventory_transfer",{p_inventory_id:inventoryId,p_to_branch_id:toBranchId,p_quantity:quantity,p_notes:notes?.trim()||null});},
  async getTransferHistory(limit=50){return await supabase.from("inventory_transfers").select("id, inventory_id, from_branch_id, to_branch_id, quantity, status, notes, created_at").order("created_at",{ascending:false}).limit(limit);},
};
