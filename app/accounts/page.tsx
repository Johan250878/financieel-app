"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  starting_balance: number;
};

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  account_id?: string | null;
  user_id: string;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setErrorMessage("Geen gebruiker gevonden.");
        setLoading(false);
        return;
      }

      await Promise.all([
        fetchAccounts(session.user.id),
        fetchTransactions(session.user.id),
      ]);

      setLoading(false);
    }

    loadPage();
  }, []);

  async function fetchAccounts(userId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, starting_balance")
      .eq("user_id", userId)
      .order("name");

    if (error) {
      console.error("Accounts error:", error);
      setErrorMessage(`Kon rekeningen niet ophalen: ${error.message}`);
      return;
    }

    setAccounts((data as Account[]) || []);
  }

  async function fetchTransactions(userId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, type, account_id, user_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Transactions error:", error);
      setErrorMessage(`Kon transacties niet ophalen: ${error.message}`);
      return;
    }

    setTransactions((data as Transaction[]) || []);
  }

  function getAccountActualBalance(accountId: string, startingBalance: number) {
    const accountTransactions = transactions.filter(
      (tx) => tx.account_id === accountId
    );

    const transactionTotal = accountTransactions.reduce((sum, tx) => {
      const amount = Number(tx.amount || 0);
      return tx.type === "income" ? sum + amount : sum - amount;
    }, 0);

    return Number(startingBalance || 0) + transactionTotal;
  }

  const totalAccountsBalance = useMemo(() => {
    return accounts.reduce(
      (sum, account) =>
        sum + getAccountActualBalance(account.id, account.starting_balance),
      0
    );
  }, [accounts, transactions]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            Laden...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Rekeningen
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Overzicht van je rekeningen
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Hier zie je per rekening het actuele saldo op basis van startsaldo en transacties.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5"
            >
              Terug naar dashboard
            </Link>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
            {errorMessage}
          </div>
        )}

        <section className="mb-6">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-medium text-zinc-500">Totaal saldo over alle rekeningen</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
              € {totalAccountsBalance.toFixed(2)}
            </p>
          </div>
        </section>

        <section>
          {accounts.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white p-6 text-center text-zinc-500">
              Nog geen rekeningen gevonden
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)]"
                >
                  <div>
                    <p className="text-lg font-medium text-zinc-900">{acc.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Startsaldo: € {Number(acc.starting_balance || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Actueel saldo</p>
                    <p className="text-xl font-semibold text-zinc-900">
                      € {getAccountActualBalance(acc.id, acc.starting_balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}