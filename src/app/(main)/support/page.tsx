"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Pastikan install textarea via shadcn
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full w-full p-6 md:p-10 space-y-8 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Pusat Bantuan
        </h1>
        <p className="text-lg text-muted-foreground">
          Punya pertanyaan atau kendala? Kami siap membantu Anda kapan saja.
        </p>
      </motion.div>

      {/* Quick Cards */}
      <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
        {[
          {
            title: "Chat Live",
            desc: "Ngobrol langsung dengan AI",
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
            desc: "Panduan penggunaan lengkap",
            icon: FileText,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className={`p-4 rounded-full mb-4 ${item.bg}`}>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full mt-8">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 shadow-sm h-fit"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Kirim Pesan
          </h2>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input
                id="subject"
                placeholder="Apa yang bisa kami bantu?"
                className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                placeholder="Jelaskan detail kendala Anda..."
                className="min-h-[150px] bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 resize-none"
              />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 text-base">
              <Send className="w-4 h-4 mr-2" /> Kirim Tiket
            </Button>
          </form>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold px-2">Pertanyaan Umum (FAQ)</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                q: "Apakah Vibe Coder gratis?",
                a: "Ya, kami menyediakan paket gratis untuk penggunaan dasar. Paket Pro tersedia untuk fitur lebih lanjut.",
              },
              {
                q: "Bagaimana cara mengganti model AI?",
                a: "Anda dapat mengganti model AI melalui dropdown di kolom chat pada halaman utama.",
              },
              {
                q: "Apakah data chat saya aman?",
                a: "Tentu saja. Privasi adalah prioritas kami. Semua percakapan dienkripsi dan disimpan dengan aman.",
              },
              {
                q: "Bagaimana cara menghapus riwayat chat?",
                a: "Anda bisa menghapus riwayat chat melalui menu pengaturan atau dengan menekan tombol hapus pada sidebar.",
              },
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white dark:bg-zinc-900 border border-border rounded-2xl px-4 shadow-sm"
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
