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
  starting_balance: number;
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
      .select(
        `
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
      `
      )
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
      .select("id, name, starting_balance")
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

  const totalBalance = useMemo(() => {
  return accounts.reduce(
    (sum, account) =>
      sum + getAccountActualBalance(account.id, account.starting_balance),
    0
  );
}, [accounts, transactions]);

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
      <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[28px] border border-zinc-200 bg-white px-6 py-4 text-zinc-600 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            Dashboard laden...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6 lg:mb-8 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                Financieel overzicht
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
                Grip op jullie geld, in één oogopslag
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                Bekijk saldo’s, rekeningen en recente transacties in een rustige,
                moderne dashboardweergave.
              </p>

              {user?.email && (
                <p className="mt-5 text-sm text-zinc-500">
                  Ingelogd als <span className="font-medium text-zinc-700">{user.email}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/accounts"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]"
              >
                Beheer rekeningen
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-[0_8px_20px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
            {errorMessage}
          </div>
        )}

        <section className="mb-6 grid gap-4 lg:mb-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.06)] sm:p-7 lg:h-full lg:p-8">
              <p className="text-sm font-medium text-zinc-500">Totaal saldo</p>

              <div className="mt-4">
                <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                  € {totalBalance.toFixed(2)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Totaal van alle gekoppelde rekeningen in jouw overzicht.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/accounts"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,24,27,0.22)] transition hover:-translate-y-0.5 hover:bg-black"
                >
                  Naar rekeningen
                </Link>

                <a
                  href="#nieuwe-transactie"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-[0_8px_20px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]"
                >
                  Nieuwe transactie
                </a>
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
            className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.06)] sm:p-6 xl:col-span-5"
          >
            <div className="mb-5">
              <p className="text-sm font-medium text-zinc-500">Toevoegen</p>
              <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
                Nieuwe transactie
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Leg inkomsten en uitgaven direct vast zodat je overzicht actueel blijft.
              </p>
            </div>

            <TransactionForm />
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.06)] sm:p-6 xl:col-span-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Overzicht</p>
                <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
                  Recente transacties
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  De laatste bewegingen op jullie rekeningen.
                </p>
              </div>

              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                {transactions.length} transacties
              </div>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
                Nog geen transacties gevonden.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-4 rounded-[24px] border border-zinc-200 bg-[#fcfcfd] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] sm:p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-zinc-900">
                          {tx.description}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            tx.type === "income"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {tx.type === "income" ? "Inkomst" : "Uitgave"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
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
                            tx.type === "income" ? "text-emerald-700" : "text-rose-700"
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
          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.06)] sm:p-6 xl:col-span-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Rekeningen</p>
                <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
                  Saldo per rekening
                </h3>
              </div>

              <Link
                href="/accounts"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
              >
                Alles bekijken
              </Link>
            </div>

            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                  Nog geen rekeningen gevonden.
                </div>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-[#fcfcfd] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{account.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">Beschikbaar saldo</p>
                    </div>

                    <p className="ml-4 text-base font-semibold text-zinc-900">
                    € {getAccountActualBalance(account.id, account.starting_balance).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.06)] sm:p-6 xl:col-span-7">
            <div className="mb-5">
              <p className="text-sm font-medium text-zinc-500">Inzicht</p>
              <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
                Samenvatting
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Een rustige samenvatting van de huidige stand van zaken.
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
      ? "text-emerald-700"
      : accent === "red"
      ? "text-rose-700"
      : "text-zinc-900";

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.05)] sm:p-6">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
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

  const classes =
    "group rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,0,0,0.07)]";

  if (isAnchor) {
    return (
      <a href={href} className={classes}>
        <div className="flex h-full flex-col">
          <p className="text-lg font-semibold text-zinc-900">{title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          <span className="mt-5 text-sm font-semibold text-zinc-700 transition group-hover:text-zinc-900">
            Openen →
          </span>
        </div>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      <div className="flex h-full flex-col">
        <p className="text-lg font-semibold text-zinc-900">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        <span className="mt-5 text-sm font-semibold text-zinc-700 transition group-hover:text-zinc-900">
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
    <div className="rounded-[24px] border border-zinc-200 bg-[#fcfcfd] p-4 shadow-[0_8px_22px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  );
}