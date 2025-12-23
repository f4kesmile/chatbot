"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, BookOpen, Save, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  updatedAt?: string | null;
};

export default function KnowledgePage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [newInfoTitle, setNewInfoTitle] = useState("");
  const [newInfoContent, setNewInfoContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("KnowledgeBase")
      .select("*")
      .order("updatedAt", { ascending: false });

    if (data) setKnowledgeList(data as unknown as KnowledgeItem[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchKnowledge();
    }, 0);

    return () => clearTimeout(t);
  }, [fetchKnowledge]);

  async function addKnowledge() {
    if (!newInfoTitle || !newInfoContent) {
      toast.warning("Judul dan konten wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("KnowledgeBase").insert({
      title: newInfoTitle,
      content: newInfoContent,
      category: "INFO",
    });

    setIsSubmitting(false);

    if (!error) {
      toast.success("Knowledge base berhasil ditambahkan");
      setNewInfoTitle("");
      setNewInfoContent("");
      await fetchKnowledge();
    } else {
      toast.error("Gagal menyimpan data");
    }
  }

  async function deleteKnowledge(id: string) {
    // Optimistic delete UI
    const prevList = [...knowledgeList];
    setKnowledgeList((prev) => prev.filter((i) => i.id !== id));
    toast.message("Menghapus data...", { duration: 1000 });

    const { error } = await supabase
      .from("KnowledgeBase")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      setKnowledgeList(prevList); // Revert
    } else {
      toast.success("Data dihapus permanen");
    }
  }

  // Filter Logic
  const filteredList = knowledgeList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm">
            Ajari bot Anda agar bisa menjawab pertanyaan spesifik secara
            otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 space-y-4 sticky top-0">
            <div className="flex items-center gap-2 font-semibold text-primary mb-2">
              <Plus className="w-5 h-5" /> Tambah Pengetahuan
            </div>

            <div className="space-y-2">
              <Label>Topik / Pertanyaan</Label>
              <Input
                placeholder="Misal: Cara Reset Password"
                value={newInfoTitle}
                onChange={(e) => setNewInfoTitle(e.target.value)}
                className="bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label>Jawaban Bot</Label>
              <Textarea
                placeholder="Jelaskan detail jawabannya di sini..."
                className="min-h-[150px] resize-none bg-transparent"
                value={newInfoContent}
                onChange={(e) => setNewInfoContent(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={addKnowledge}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan ke Database
            </Button>
          </div>
        </div>

        {/* KOLOM KANAN: LIST DATA */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari knowledge base..."
              className="pl-9 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Memuat data...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Belum ada data knowledge base.
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm group hover:border-primary/50 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteKnowledge(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
