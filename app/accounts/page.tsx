"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  starting_balance: number;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, starting_balance")
      .order("name");

    if (error) {
      console.error("Accounts error:", error);
    } else {
      setAccounts(data || []);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-6 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Rekeningen</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Overzicht van al je betaal- en spaarrekeningen
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition"
            >
              Terug
            </Link>
          </div>
        </header>

        {/* LOADING */}
        {loading ? (
          <div className="text-center text-zinc-500">Laden...</div>
        ) : (
          <div className="grid gap-4">

            {accounts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white p-6 text-center text-zinc-500">
                Nog geen rekeningen gevonden
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)] transition"
                >
                  <div>
                    <p className="font-medium text-lg">{acc.name}</p>
                    <p className="text-sm text-zinc-500">
                      Start saldo
                    </p>
                  </div>

                  <p className="text-xl font-semibold text-zinc-900">
                    € {Number(acc.starting_balance || 0).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}