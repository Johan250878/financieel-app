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
  accounts?: { name: string }[] | null;
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

  const recentTransactions = transactions.slice(0, 6);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-zinc-300 shadow-2xl backdrop-blur">
            Dashboard laden...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.10),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur md:mb-8 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-[0.2em] text-zinc-300 uppercase">
                  Financieel overzicht
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Grip op jullie geld, in één oogopslag
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
                  Bekijk saldo’s, rekeningen en recente transacties in een rustige,
                  moderne dashboardweergave.
                </p>

                {user?.email && (
                  <p className="mt-4 text-sm text-zinc-400">
                    Ingelogd als <span className="text-zinc-200">{user.email}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/accounts"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg transition hover:scale-[1.02] hover:bg-zinc-100"
                >
                  Beheer rekeningen
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </header>

          {errorMessage && (
            <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <section className="mb-6 grid gap-4 lg:mb-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="relative h-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-5 shadow-2xl sm:p-6 lg:p-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative">
                  <p className="text-sm font-medium text-zinc-400">Totaal saldo</p>

                  <div className="mt-4">
                    <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      € {totalBalance.toFixed(2)}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Totaal van alle gekoppelde rekeningen in jouw overzicht.
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                    <Link
                      href="/accounts"
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
                    >
                      Naar rekeningen
                    </Link>

                    <a
                      href="#nieuwe-transactie"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Nieuwe transactie
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
              <StatCard
                label="Inkomsten"
                value={`€ ${totalIncome.toFixed(2)}`}
                sublabel="Totaal geregistreerd"
                accent="green"
              />
              <StatCard
                label="Uitgaven"
                value={`€ ${totalExpense.toFixed(2)}`}
                sublabel="Totaal geregistreerd"
                accent="red"
              />
              <StatCard
                label="Rekeningen"
                value={`${accounts.length}`}
                sublabel="Actieve rekeningen"
                accent="neutral"
              />
            </div>
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              title="Nieuwe transactie"
              description="Voeg direct een inkomsten- of uitgavetransactie toe."
              href="#nieuwe-transactie"
            />
            <QuickActionCard
              title="Rekeningen"
              description="Bekijk en beheer jullie betaal- en spaarrekeningen."
              href="/accounts"
            />
            <QuickActionCard
              title="Spaarpotjes"
              description="Maak later aparte potjes voor doelen en reserveringen."
              href="/accounts"
            />
            <QuickActionCard
              title="Vaste lasten"
              description="Voorbereid op een volgende stap in je dashboard."
              href="/accounts"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div
              id="nieuwe-transactie"
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6 xl:col-span-5"
            >
              <div className="mb-5">
                <p className="text-sm font-medium text-zinc-400">Toevoegen</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  Nieuwe transactie
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Leg inkomsten en uitgaven direct vast zodat je overzicht actueel blijft.
                </p>
              </div>

              <TransactionForm />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6 xl:col-span-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Overzicht</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">
                    Recente transacties
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    De laatste bewegingen op jullie rekeningen.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                  {transactions.length} transacties
                </div>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 p-6 text-sm text-zinc-400">
                  Nog geen transacties gevonden.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-4 transition hover:bg-zinc-900/80 sm:p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-white">
                            {tx.description}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              tx.type === "income"
                                ? "bg-green-500/15 text-green-300"
                                : "bg-red-500/15 text-red-300"
                            }`}
                          >
                            {tx.type === "income" ? "Inkomst" : "Uitgave"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                          <span>
                            {new Date(tx.transaction_date).toLocaleDateString("nl-NL")}
                          </span>
                          {tx.accounts?.[0]?.name && (
                            <span>Rekening: {tx.accounts[0].name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <div className="text-left md:text-right">
                          <p
                            className={`text-lg font-semibold ${
                              tx.type === "income" ? "text-green-300" : "text-red-300"
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
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:mt-8 xl:grid-cols-12">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6 xl:col-span-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Rekeningen</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">
                    Saldo per rekening
                  </h3>
                </div>

                <Link
                  href="/accounts"
                  className="text-sm font-medium text-zinc-300 transition hover:text-white"
                >
                  Alles bekijken
                </Link>
              </div>

              <div className="space-y-3">
                {accounts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 p-5 text-sm text-zinc-400">
                    Nog geen rekeningen gevonden.
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-3xl border border-white/10 bg-zinc-950/60 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{account.name}</p>
                        <p className="mt-1 text-sm text-zinc-400">Beschikbaar saldo</p>
                      </div>

                      <p className="ml-4 text-base font-semibold text-white">
                        € {Number(account.balance || 0).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6 xl:col-span-7">
              <div className="mb-5">
                <p className="text-sm font-medium text-zinc-400">Inzicht</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  Samenvatting
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Dit blok geeft je een rustige managementsamenvatting van de huidige stand.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <InsightCard
                  title="Positie"
                  text={
                    totalBalance >= 0
                      ? "Je totale saldo staat positief."
                      : "Je totale saldo staat negatief."
                  }
                />
                <InsightCard
                  title="Grootste stroom"
                  text={
                    totalExpense > totalIncome
                      ? "De uitgaven zijn momenteel hoger dan de inkomsten."
                      : "De inkomsten zijn momenteel hoger dan de uitgaven."
                  }
                />
                <InsightCard
                  title="Structuur"
                  text={`Je dashboard bevat nu ${accounts.length} rekening(en) en ${transactions.length} transactie(s).`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent: "green" | "red" | "neutral";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-300"
      : accent === "red"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${accentClass}`}>
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{sublabel}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  const isAnchor = href.startsWith("#");

  if (isAnchor) {
    return (
      <a
        href={href}
        className="group rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur transition hover:bg-white/10"
      >
        <div className="flex h-full flex-col">
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          <span className="mt-5 text-sm font-medium text-zinc-200 transition group-hover:text-white">
            Openen →
          </span>
        </div>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur transition hover:bg-white/10"
    >
      <div className="flex h-full flex-col">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        <span className="mt-5 text-sm font-medium text-zinc-200 transition group-hover:text-white">
          Openen →
        </span>
      </div>
    </Link>
  );
}

function InsightCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/50 p-4">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}