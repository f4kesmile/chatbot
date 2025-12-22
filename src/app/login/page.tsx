"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else
      alert(
        "Sukses! Cek email kamu (atau langsung login jika settingan confirm off)"
      );
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      router.push("/"); // Redirect ke home kalau sukses
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md p-8 space-y-4 border border-zinc-800 rounded-xl bg-zinc-900">
        <h1 className="text-2xl font-bold text-center">Login / Daftar</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500"
        />

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSignUp}
            className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-bold transition"
          >
            Daftar Baru
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
          >
            Masuk (Login)
          </button>
        </div>
      </div>
    </div>
  );
}
