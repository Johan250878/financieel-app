"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import TransactionForm from "../app/TransactionForm";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  type: "income" | "expense";
  user_id: string;
  account_id: string | null;
};

type Account = {
  id: string;
  name: string;
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
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("id, name")
        .order("name", { ascending: true });

      if (accountsError) {
        setErrorMessage(accountsError.message);
        setLoading(false);
        return;
      }

      setAccounts((accountsData as Account[]) ?? []);

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false });

      if (txError) {
        setErrorMessage(txError.message);
      } else {
        setTransactions((txData as Transaction[]) ?? []);
      }

      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getAccountBalance(accountId: string) {
    const income = transactions
      .filter((t) => t.account_id === accountId && t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.account_id === accountId && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return income - expense;
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Laden...</main>;
  }

  if (errorMessage) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Financieel overzicht</h1>
        <p style={{ color: "red" }}>Fout: {errorMessage}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Financieel overzicht</h1>

      <p>Ingelogd als: {user?.email}</p>
      <button onClick={handleLogout}>Uitloggen</button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Saldo per rekening</h2>
      <div style={{ marginBottom: "2rem" }}>
        {accounts.map((account) => (
          <div
            key={account.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <strong>{account.name}</strong>
            <div>€ {getAccountBalance(account.id).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <TransactionForm />

      <h2>Transacties</h2>

      {transactions.length === 0 && <p>Geen transacties</p>}

      {transactions.map((t) => {
        const accountName =
          accounts.find((a) => a.id === t.account_id)?.name || "Onbekende rekening";

        return (
          <div key={t.id} style={{ marginBottom: 12 }}>
            <strong>{t.description}</strong> - €{Number(t.amount).toFixed(2)}
            <div>{t.transaction_date}</div>
            <div>{t.type === "income" ? "Inkomst" : "Uitgave"}</div>
            <div>Rekening: {accountName}</div>
            <button onClick={() => handleDelete(t.id)} style={{ marginTop: 6 }}>
              Verwijder
            </button>
          </div>
        );
      })}
    </main>
  );
}
