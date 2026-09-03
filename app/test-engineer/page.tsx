"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const TEST_ENGINEER_ID =
  "4bbf3597-3851-419d-8dcc-9225e1acc6f2";

const TEST_INVENTORY_ID =
  "30d17b31-95bf-49cd-8c7d-af57b3df103b";

export default function TestEngineerPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function testPaymentIn() {
    setLoading(true);
    setResult("Recording payment...");

    const { data, error } = await supabase.rpc(
      "engineer_payment_in",
      {
        p_engineer_id: TEST_ENGINEER_ID,
        p_amount: 2000,
        p_payment_method: "Cash",
        p_notes: "NOVATECH Engineer System Test",
      }
    );

    if (error) {
      setResult(`❌ ERROR\n\n${error.message}`);
      setLoading(false);
      return;
    }

    setResult(
      `✅ PAYMENT IN SUCCESSFUL\n\nTransaction ID:\n${data}`
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">
          Engineer System Test
        </h1>

        <p className="mt-2 text-muted-foreground">
          Testing the Engineer Payment In transaction.
        </p>

        <div className="mt-6 rounded-xl border p-5">
          <h2 className="font-semibold">
            Payment In Test
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Test Engineer pays NOVATECH ₦2,000.
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Engineer:</strong> Test Engineer
            </p>
            <p>
              <strong>Amount:</strong> ₦2,000
            </p>
            <p>
              <strong>Method:</strong> Cash
            </p>
            <p>
              <strong>Current Balance:</strong> ₦2,000 owed
            </p>
            <p>
              <strong>Expected Balance:</strong> ₦0
            </p>
          </div>

          <button
            onClick={testPaymentIn}
            disabled={loading}
            className="mt-6 rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Record ₦2,000 Payment"}
          </button>
        </div>

        {result && (
          <pre className="mt-6 whitespace-pre-wrap rounded-xl border p-5 text-sm">
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}