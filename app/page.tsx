"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  type: "income" | "expense";
  user_id: string;
  account_id: string;
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

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAccountId, setSelectedAccountId] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("id, name, starting_balance")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (accountsError) {
        setErrorMessage("Fout bij laden van rekeningen: " + accountsError.message);
        setLoading(false);
        return;
      }

      const safeAccounts: Account[] = (accountsData || []).map((account: any) => ({
        id: account.id,
        name: account.name,
        starting_balance: Number(account.starting_balance ?? 0),
      }));

      setAccounts(safeAccounts);

      if (safeAccounts.length > 0) {
        setSelectedAccountId(safeAccounts[0].id);
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("id, description, amount, transaction_date, type, user_id, account_id")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (transactionsError) {
        setErrorMessage(
          "Fout bij laden van transacties: " + transactionsError.message
        );
        setLoading(false);
        return;
      }

      const safeTransactions: Transaction[] = (transactionsData || []).map((tx: any) => ({
        ...tx,
        amount: Number(tx.amount),
      }));

      setTransactions(safeTransactions);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!description.trim()) {
      setErrorMessage("Vul een omschrijving in.");
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      setErrorMessage("Vul een geldig bedrag in.");
      return;
    }

    if (!selectedAccountId) {
      setErrorMessage("Kies een rekening.");
      return;
    }

    if (!user) {
      setErrorMessage("Geen gebruiker gevonden.");
      return;
    }

    const insertPayload = {
      description: description.trim(),
      amount: Number(amount),
      type,
      transaction_date: transactionDate,
      user_id: user.id,
      account_id: selectedAccountId,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([insertPayload])
      .select();

    if (error) {
      setErrorMessage("Fout bij toevoegen transactie: " + error.message);
      return;
    }

    const newTransaction = data?.[0];
    if (newTransaction) {
      setTransactions((prev) => [
        { ...newTransaction, amount: Number(newTransaction.amount) },
        ...prev,
      ]);
    }

    setDescription("");
    setAmount("");
    setType("expense");
    setTransactionDate(new Date().toISOString().split("T")[0]);
  }

  function getAccountBalance(account: Account) {
    const accountTransactions = transactions.filter(
      (tx) => tx.account_id === account.id
    );

    return accountTransactions.reduce((sum, tx) => {
      return tx.type === "income"
        ? sum + Number(tx.amount)
        : sum - Number(tx.amount);
    }, Number(account.starting_balance));
  }

  function getAccountName(accountId: string) {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.name : "Onbekende rekening";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-lg">Laden...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow">
          <div>
            <h1 className="text-3xl font-bold">Financieel overzicht</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ingelogd als: {user?.email}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/accounts"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-white hover:opacity-90"
            >
              Rekeningen
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Nieuwe transactie</h2>

          <form onSubmit={handleAddTransaction} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Omschrijving</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black"
                placeholder="Bijv. Boodschappen"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Bedrag</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black"
              >
                <option value="expense">Uitgave</option>
                <option value="income">Inkomst</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Datum</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rekening</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black"
              >
                {accounts.length === 0 ? (
                  <option value="">Geen rekeningen gevonden</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
              >
                Transactie toevoegen
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Saldo per rekening</h2>

          {accounts.length === 0 ? (
            <p className="text-zinc-600">Geen rekeningen gevonden.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {accounts.map((account) => {
                const balance = getAccountBalance(account);

                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <h3 className="text-lg font-semibold">{account.name}</h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      Beginsaldo: € {Number(account.starting_balance).toFixed(2)}
                    </p>
                    <p className="mt-3 text-2xl font-bold">
                      € {balance.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Transacties</h2>

          {transactions.length === 0 ? (
            <p className="text-zinc-600">Nog geen transacties gevonden.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{tx.description}</p>
                    <p className="text-sm text-zinc-500">
                      {tx.transaction_date} • {getAccountName(tx.account_id)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}€{" "}
                      {Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {tx.type === "income" ? "Inkomst" : "Uitgave"}
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