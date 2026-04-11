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
}