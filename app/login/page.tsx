<<<<<<< HEAD
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const login = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    window.location.href = '/accounts'
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">Inloggen</h1>

        <form onSubmit={login} className="space-y-4">
          <input
            className="w-full rounded-xl border p-3"
            placeholder="E-mailadres"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            placeholder="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full rounded-xl bg-black p-3 text-white">
            Inloggen
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-red-600">{message}</p>
        )}
      </div>
    </main>
  )
=======
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Account aangemaakt. Log nu in.");
      setIsLogin(true);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      alert("Vul eerst je e-mail in.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://financieel-app.vercel.app/reset-password",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check je mail voor de resetlink.");
  }

  return (
    <main style={{ padding: 40, maxWidth: 400 }}>
      <h1>{isLogin ? "Inloggen" : "Account maken"}</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Bezig..." : isLogin ? "Inloggen" : "Registreren"}
        </button>
      </form>

      {isLogin && (
        <div style={{ marginTop: 16 }}>
          <button onClick={handleResetPassword}>Wachtwoord vergeten?</button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Maak account" : "Ga naar login"}
        </button>
      </div>
    </main>
  );
>>>>>>> 605c7241305da74cc13f97e1040dd3e71abc0667
}