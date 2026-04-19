"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  name: string;
  balance: number;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const { data, error } = await supabase
      .from("accounts")
      .select("*");

    if (error) {
      console.error(error);
    } else {
      setAccounts(data || []);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-6">
      <h1 className="text-2xl font-semibold mb-6">Rekeningen</h1>

      <div className="grid gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white p-5 rounded-2xl shadow"
          >
            <p className="font-medium">{acc.name}</p>
            <p className="text-gray-500">
              € {Number(acc.balance).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}