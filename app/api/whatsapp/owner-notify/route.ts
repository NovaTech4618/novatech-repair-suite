import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

type EventType = "sale" | "repair";

type Body = { type: EventType; id: string };

type SaleNotificationRow = {
  id: string;
  company_id: string;
  total: number | null;
  payment_method: string | null;
  staff_name: string | null;
  customers:
    | { full_name: string | null }
    | Array<{ full_name: string | null }>
    | null;
};

type RepairNotificationRow = {
  id: string;
  company_id: string;
  status: string | null;
  issue: string | null;
  technician: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  devices:
    | {
        brand: string | null;
        model: string | null;
        customers:
          | { full_name: string | null }
          | Array<{ full_name: string | null }>
          | null;
      }
    | Array<{
        brand: string | null;
        model: string | null;
        customers:
          | { full_name: string | null }
          | Array<{ full_name: string | null }>
          | null;
      }>
    | null;
};

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status },
  );
}

function providerErrorMessage(result: unknown) {
  if (!result || typeof result !== "object") return "WhatsApp provider rejected the message";
  const error = (result as { error?: { message?: string; code?: number; error_data?: { details?: string } } }).error;
  return error?.error_data?.details || error?.message || "WhatsApp provider rejected the message";
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
    const templateName = process.env.WHATSAPP_OWNER_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_OWNER_TEMPLATE_LANGUAGE || "en_US";

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

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Invalid session", 401);

    const { data: companyId, error: companyIdError } = await supabase.rpc("get_my_company_id");
    if (companyIdError || !companyId) return jsonError("Your company could not be resolved", 403);

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, owner_id, name, owner_whatsapp_phone, showcase_phone")
      .eq("id", companyId)
      .single();

    if (companyError || !company) return jsonError("Company not found", 404);

    const ownerPhone = normalizeWhatsAppPhone(
      company.owner_whatsapp_phone || company.showcase_phone || "",
    );
    if (!ownerPhone) return jsonError("Boss WhatsApp number is not configured", 422);

    let message = "";

    if (body.type === "sale") {
      const { data: sale, error } = await supabase
        .from("sales")
        .select("id, company_id, total, payment_method, staff_name, customers(full_name)")
        .eq("id", body.id)
        .eq("company_id", companyId)
        .single();
      if (error || !sale) return jsonError("Sale not found", 404);

      const saleRow = sale as unknown as SaleNotificationRow;
      const customer = Array.isArray(saleRow.customers)
        ? saleRow.customers[0]?.full_name
        : saleRow.customers?.full_name;
      message = [
        "NOVATECH — New Sale",
        `Business: ${company.name}`,
        `Amount: ₦${Number(saleRow.total ?? 0).toLocaleString("en-NG")}`,
        `Customer: ${customer || "Walk-in customer"}`,
        `Payment: ${saleRow.payment_method || "Not specified"}`,
        `Staff: ${saleRow.staff_name || "Not specified"}`,
        `Sale ID: ${saleRow.id}`,
      ].join("\n");
    } else {
      const { data: repair, error } = await supabase
        .from("repairs")
        .select("id, company_id, status, issue, technician, estimated_cost, final_cost, devices(brand, model, customers(full_name))")
        .eq("id", body.id)
        .eq("company_id", companyId)
        .single();
      if (error || !repair) return jsonError("Repair not found", 404);

      const repairRow = repair as unknown as RepairNotificationRow;
      const device = Array.isArray(repairRow.devices) ? repairRow.devices[0] : repairRow.devices;
      const customer = Array.isArray(device?.customers)
        ? device.customers[0]?.full_name
        : device?.customers?.full_name;
      const deviceName = [device?.brand, device?.model].filter(Boolean).join(" ") || "Device";
      message = [
        "NOVATECH — Repair Update",
        `Business: ${company.name}`,
        `Device: ${deviceName}`,
        `Customer: ${customer || "Walk-in customer"}`,
        `Problem: ${repairRow.issue || "Not specified"}`,
        `Status: ${repairRow.status || "Not specified"}`,
        `Technician: ${repairRow.technician || "Not assigned"}`,
        `Estimated: ₦${Number(repairRow.estimated_cost ?? 0).toLocaleString("en-NG")}`,
        `Final: ₦${Number(repairRow.final_cost ?? 0).toLocaleString("en-NG")}`,
        `Repair ID: ${repairRow.id}`,
      ].join("\n");
    }

    // Owner alerts are proactive business-initiated messages. A normal text
    // message can be rejected when the owner's 24-hour WhatsApp service window
    // is closed, so production should use a Meta-approved utility template.
    const payload = templateName
      ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: ownerPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: message }],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: ownerPhone,
          type: "text",
          text: { preview_url: false, body: message },
        };

    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const details = providerErrorMessage(result);
      console.error("WhatsApp owner notification failed", {
        status: response.status,
        provider: result,
        template: Boolean(templateName),
      });
      return jsonError(details, 502, { provider_status: response.status });
    }

    const messageId = result?.messages?.[0]?.id ?? null;
    if (!messageId) {
      return jsonError("WhatsApp accepted the request but returned no message ID", 502);
    }

    return NextResponse.json({
      ok: true,
      messageId,
      mode: templateName ? "template" : "text",
    });
  } catch (error) {
    console.error("WhatsApp owner notification error", error);
    return jsonError("Unable to send WhatsApp notification", 500);
  }
}
