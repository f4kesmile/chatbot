"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageCircle,
  Send,
  Mail,
  FileText,
  History,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SupportLandingPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [quickSubject, setQuickSubject] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubject.trim() || !quickMessage.trim())
      return toast.warning("Mohon lengkapi subjek dan pesan.");

    setIsCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu.");
        return;
      }

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: quickSubject, message: quickMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Tiket berhasil dibuat!", {
        description: "Mengalihkan ke halaman tracking...",
        icon: <CheckCircle2 className="text-green-500" />,
      });

      // Redirect ke halaman Tracking
      setTimeout(() => router.push("/tickets"), 1500);

      setQuickSubject("");
      setQuickMessage("");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat tiket.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-full w-full p-6 md:p-10 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Pusat Bantuan
          </h1>
          <p className="text-lg text-muted-foreground">
            Kami siap membantu Anda. Cari jawaban atau hubungi kami langsung
            jika mengalami kendala.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => router.push("/tickets")}
              variant="outline"
              className="gap-2 rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
            >
              <History size={16} /> Lihat Tiket Saya <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Chat Live / Tiket",
              desc: "Tanya jawab dengan admin",
              icon: MessageCircle,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              title: "Email Support",
              desc: "Respon dalam 24 jam",
              icon: Mail,
              color: "text-purple-500",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
            {
              title: "Dokumentasi",
              desc: "Panduan penggunaan",
              icon: FileText,
              color: "text-orange-500",
              bg: "bg-orange-50 dark:bg-orange-900/20",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className={`p-4 rounded-full mb-4 ${item.bg}`}>
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form & FAQ */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Kirim Tiket Baru
            </h2>
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subjek / Judul</Label>
                <Input
                  placeholder="Contoh: Error saat upload file"
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                  disabled={isCreating}
                  className="bg-zinc-50 dark:bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Detail Pesan</Label>
                <Textarea
                  placeholder="Jelaskan detail masalahnya..."
                  rows={5}
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  disabled={isCreating}
                  className="bg-zinc-50 dark:bg-zinc-950 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-base"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Kirim Tiket
              </Button>
            </form>
          </div>

          {/* FAQ */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold px-2">Pertanyaan Umum (FAQ)</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Apakah layanan ini gratis?",
                  a: "Ya, fitur dasar tersedia gratis untuk semua pengguna terdaftar.",
                },
                {
                  q: "Berapa lama admin membalas?",
                  a: "Biasanya dalam 10-30 menit pada jam kerja (09.00 - 17.00 WIB).",
                },
                {
                  q: "Apakah chat saya aman?",
                  a: "Tentu, percakapan Anda terenkripsi dan hanya bisa dilihat oleh Anda dan tim support.",
                },
                {
                  q: "Bagaimana cara menutup tiket?",
                  a: "Anda bisa meminta admin untuk menutup tiket, atau tiket akan tertutup otomatis setelah masalah selesai.",
                },
              ].map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
