"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/30 dark:bg-zinc-900">
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Gagal Login
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Terjadi kesalahan saat memproses login Google Anda. Hal ini biasanya
          terjadi karena konfigurasi URL redirect yang belum sesuai.
        </p>
        <div className="mt-4 flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
