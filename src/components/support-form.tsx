"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export function SupportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Client Side
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.warning("Data Belum Lengkap", {
        description: "Mohon isi subjek dan pesan terlebih dahulu.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim pesan.");
      }

      // Sukses
      toast.success("Pesan Terkirim!", {
        description: "Tim kami akan segera menghubungi Anda via email.",
      });

      // Reset Form
      setFormData({ subject: "", message: "" });
    } catch (error: any) {
      toast.error("Gagal Mengirim", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium">
          Subjek / Topik
        </Label>
        <Input
          id="subject"
          placeholder="Misal: Error saat upload gambar..."
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          className="bg-white dark:bg-zinc-900"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Pesan Detail
        </Label>
        <Textarea
          id="message"
          placeholder="Jelaskan masalah yang Anda alami secara detail..."
          rows={5}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className="bg-white dark:bg-zinc-900 resize-none"
          disabled={isLoading}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Kirim Pesan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
