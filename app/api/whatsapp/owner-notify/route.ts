import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

type EventType = "sale" | "repair";

type Body = {
  type: EventType;
  id: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonError("Authentication required", 401);

    const body = (await request.json()) as Partial<Body>;
    if ((body.type !== "sale" && body.type !== "repair") || !body.id) {
      return jsonError("Invalid notification payload");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const graphVersion = process.env.WHATSAPP_GRAPH_VERSION;

    if (!supabaseUrl || !publishableKey) {
      return jsonError("Supabase server configuration is missing", 500);
    }

    if (!accessToken || !phoneNumberId || !graphVersion) {
      return jsonError("WhatsApp Cloud API is not configured", 503);
    }

    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) return jsonError("Invalid session", 401);

    const { data: companyId, error: companyIdError } = await supabase.rpc(
      "get_my_company_id",
    );
    if (companyIdError || !companyId) {
      return jsonError("Your company could not be resolved", 403);
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, owner_id, name, showcase_phone")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return jsonError("Company not found", 404);
    }

    // The destination is always the company owner's number. Staff never choose
    // the recipient and never receive these notifications themselves.
    const ownerPhone = normalizeWhatsAppPhone(company.showcase_phone ?? "");
    if (!ownerPhone) {
      return jsonError("Boss WhatsApp number is not configured", 422);
    }

    let message = "";

    if (body.type === "sale") {
      const { data: sale, error } = await supabase
        .from("sales")
        .select(
          "id, company_id, total, payment_method, staff_name, sale_date, customers(full_name)",
        )
        .eq("id", body.id)
        .eq("company_id", companyId)
        .single();

      if (error || !sale) return jsonError("Sale not found", 404);

      const customer = Array.isArray(sale.customers)
        ? sale.customers[0]?.full_name
        : sale.customers?.full_name;
      message = [
        `NOVATECH — New Sale`,
        `Business: ${company.name}`,
        `Amount: ₦${Number(sale.total ?? 0).toLocaleString("en-NG")}`,
        `Customer: ${customer || "Walk-in customer"}`,
        `Payment: ${sale.payment_method || "Not specified"}`,
        `Staff: ${sale.staff_name || "Not specified"}`,
        `Sale ID: ${sale.id}`,
      ].join("\n");
    } else {
      const { data: repair, error } = await supabase
        .from("repairs")
        .select(
          "id, company_id, status, issue, technician, estimated_cost, final_cost, devices(brand, model, customers(full_name))",
        )
        .eq("id", body.id)
        .eq("company_id", companyId)
        .single();

      if (error || !repair) return jsonError("Repair not found", 404);

      const device = Array.isArray(repair.devices)
        ? repair.devices[0]
        : repair.devices;
      const customer = Array.isArray(device?.customers)
        ? device.customers[0]?.full_name
        : device?.customers?.full_name;
      const deviceName = [device?.brand, device?.model]
        .filter(Boolean)
        .join(" ") || "Device";

      message = [
        `NOVATECH — Repair Update`,
        `Business: ${company.name}`,
        `Device: ${deviceName}`,
        `Customer: ${customer || "Walk-in customer"}`,
        `Problem: ${repair.issue || "Not specified"}`,
        `Status: ${repair.status || "Not specified"}`,
        `Technician: ${repair.technician || "Not assigned"}`,
        `Estimated: ₦${Number(repair.estimated_cost ?? 0).toLocaleString("en-NG")}`,
        `Final: ₦${Number(repair.final_cost ?? 0).toLocaleString("en-NG")}`,
        `Repair ID: ${repair.id}`,
      ].join("\n");
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: ownerPhone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("WhatsApp owner notification failed", result);
      return NextResponse.json(
        { ok: false, error: "WhatsApp provider rejected the message" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, messageId: result?.messages?.[0]?.id ?? null });
  } catch (error) {
    console.error("WhatsApp owner notification error", error);
    return jsonError("Unable to send WhatsApp notification", 500);
  }
}
