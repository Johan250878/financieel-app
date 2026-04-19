"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  name: string;
  starting_balance: number;
};

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  account_id: string;
};

export default function AccountsPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountsPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, starting_balance")
        .eq("user_id", user.id);

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("id, amount, type, account_id")
        .eq("user_id", user.id);

      setAccounts(
        (accountsData || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          starting_balance: Number(a.starting_balance ?? 0),
        }))
      );

      setTransactions(
        (transactionsData || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount),
        }))
      );

      setLoading(false);
    }

    loadAccountsPage();
  }, [router]);

  function getBalance(account: Account) {
    const tx = transactions.filter((t) => t.account_id === account.id);

    return tx.reduce((sum, t) => {
      return t.type === "income" ? sum + t.amount : sum - t.amount;
    }, account.starting_balance);
  }

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Rekeningen</h1>

      <Link href="/" className="text-blue-500 underline">
        ← Terug
      </Link>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {accounts.map((account) => (
          <div key={account.id} className="border p-4 rounded-xl">
            <h2 className="font-semibold">{account.name}</h2>
            <p className="text-sm text-gray-500">
              Beginsaldo: € {account.starting_balance.toFixed(2)}
            </p>
            <p className="text-xl font-bold mt-2">
              € {getBalance(account).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}