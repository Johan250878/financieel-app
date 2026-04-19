"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TransactionForm from "./TransactionForm";
import DeleteButton from "./DeleteButton";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  type: "income" | "expense";
  user_id: string;
  account_id?: string | null;
  accounts?: {
    name: string;
  } | null;
};

type Account = {
  id: string;
  name: string;
  balance: number;
};

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
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
        router.push("/login");
        return;
      }

      setUser(session.user);

      await Promise.all([
        fetchTransactions(session.user.id),
        fetchAccounts(session.user.id),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function fetchTransactions(userId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        description,
        amount,
        transaction_date,
        type,
        user_id,
        account_id,
        accounts (
          name
        )
      `)
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Kon transacties niet ophalen.");
      return;
    }

    setTransactions((data as Transaction[]) || []);
  }

  async function fetchAccounts(userId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, balance")
      .eq("user_id", userId)
      .order("name");

    if (error) {
      console.error(error);
      setErrorMessage("Kon rekeningen niet ophalen.");
      return;
    }

    setAccounts((data as Account[]) || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  }, [accounts]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [transactions]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-300">Laden...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
                Financieel dashboard
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welkom{user?.email ? `, ${user.email}` : ""}
              </h1>
              <p className="mt-2 text-zinc-400">
                Overzicht van je rekeningen, saldo en recente transacties.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/accounts"
                className="rounded-xl bg-white px-4 py-2 font-medium text-zinc-900 transition hover:opacity-90"
              >
                Naar rekeningen
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-zinc-700 px-4 py-2 font-medium text-white transition hover:bg-zinc-800"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
            <p className="text-sm text-zinc-400">Totaal saldo</p>
            <p className="mt-3 text-3xl font-bold">
              € {totalBalance.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
            <p className="text-sm text-zinc-400">Totale inkomsten</p>
            <p className="mt-3 text-3xl font-bold text-green-400">
              € {totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
            <p className="text-sm text-zinc-400">Totale uitgaven</p>
            <p className="mt-3 text-3xl font-bold text-red-400">
              € {totalExpense.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
            <p className="text-sm text-zinc-400">Aantal rekeningen</p>
            <p className="mt-3 text-3xl font-bold">
              {accounts.length}
            </p>
          </div>
        </section>

        <section className="mb-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Nieuwe transactie</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Voeg hier een nieuwe inkomsten- of uitgavetransactie toe.
              </p>
            </div>

            <TransactionForm />
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Rekeningen</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Huidige saldi per rekening.
                </p>
              </div>

              <Link
                href="/accounts"
                className="text-sm font-medium text-zinc-300 underline-offset-4 hover:underline"
              >
                Beheer
              </Link>
            </div>

            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
                  Nog geen rekeningen gevonden.
                </div>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-zinc-500">Beschikbaar saldo</p>
                    </div>
                    <p className="text-lg font-semibold">
                      € {Number(account.balance || 0).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Recente transacties</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Je meest recente inkomsten en uitgaven.
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-zinc-400">
              Nog geen transacties gevonden.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{tx.description}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-400">
                      <span>
                        {new Date(tx.transaction_date).toLocaleDateString("nl-NL")}
                      </span>
                      <span>
                        {tx.type === "income" ? "Inkomst" : "Uitgave"}
                      </span>
                      {tx.accounts?.name && <span>Rekening: {tx.accounts.name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          tx.type === "income" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}€
                        {Number(tx.amount).toFixed(2)}
                      </p>
                    </div>

                    <DeleteButton id={tx.id} />
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