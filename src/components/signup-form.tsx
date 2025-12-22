"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // 2. State

  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error("Gagal Login Google", { description: error.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 3. Cek Captcha
    if (!captchaToken) {
      toast.error("Mohon selesaikan verifikasi Captcha.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        captchaToken: captchaToken, // 4. Kirim Token
      },
    });

    if (error) {
      toast.error("Gagal Daftar", { description: error.message });
    } else {
      if (data.session) {
        toast.success("Pendaftaran Berhasil!", {
          description: "Mengarahkan ke dashboard...",
        });
        router.push("/");
        router.refresh();
      } else {
        toast.success("Sukses Mendaftar!", {
          description: "Silakan cek email kamu untuk verifikasi.",
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl p-4 md:p-8 shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-center text-neutral-800 dark:text-neutral-200">
        Buat Akun Baru
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Daftar untuk mulai menggunakan asisten AI.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="fullname">Nama Lengkap</Label>
          <Input
            id="fullname"
            placeholder="Contoh: Budi Santoso"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </LabelInputContainer>

        {/* 5. Komponen Turnstile */}
        <div className="mb-6 flex justify-center">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY || ""}
            onSuccess={(token) => setCaptchaToken(token)}
            onError={() => toast.error("Gagal memuat Captcha")}
            options={{
              theme: "auto",
              size: "flexible",
            }}
          />
        </div>

        <button
          className="group/btn relative flex justify-center items-center h-10 w-full rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? "Mendaftar..." : "Daftar Sekarang"}
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <button
            className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            type="button"
            onClick={handleGoogleLogin}
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              Daftar dengan Google
            </span>
            <BottomGradient />
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors underline underline-offset-4"
            >
              Sudah punya akun? Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
