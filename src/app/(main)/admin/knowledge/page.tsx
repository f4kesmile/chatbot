"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Trash2,
  BookOpen,
  Save,
  Loader2,
  Bot,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  updatedAt?: string | null;
};

const DEFAULT_SYSTEM_PROMPT = `Kamu adalah asisten AI yang ramah dan membantu untuk aplikasi Support Ticket.
Tugasmu adalah menjawab pertanyaan user berdasarkan data knowledge base yang tersedia.
Jika tidak tahu jawabannya, arahkan user untuk membuat tiket baru.
Gunakan bahasa Indonesia yang sopan dan jelas.`;

export default function KnowledgePage() {
  // --- STATE UNTUK FIX HYDRATION ERROR ---
  const [isMounted, setIsMounted] = useState(false);

  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);

  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newInfoTitle, setNewInfoTitle] = useState("");
  const [newInfoContent, setNewInfoContent] = useState("");

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [systemPromptId, setSystemPromptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // --- EFFECT UNTUK MENANDAI MOUNTED ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("KnowledgeBase")
      .select("*")
      .order("updatedAt", { ascending: false });

    if (data) {
      const promptData = data.find((item) => item.category === "SYSTEM_PROMPT");
      if (promptData) {
        setSystemPrompt(promptData.content);
        setSystemPromptId(promptData.id);
      } else {
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        setSystemPromptId(null);
      }
      const listData = data.filter((item) => item.category !== "SYSTEM_PROMPT");
      setKnowledgeList(listData as unknown as KnowledgeItem[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  async function addKnowledge() {
    if (!newInfoTitle || !newInfoContent) {
      toast.warning("Judul dan konten wajib diisi");
      return;
    }
    setIsSubmitting(true);
    // Tidak mengirim 'id' karena database sudah diset DEFAULT gen_random_uuid() atau v4()
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
      fetchKnowledge();
    } else {
      toast.error("Gagal simpan: " + error.message);
    }
  }

  async function deleteKnowledge(id: string) {
    const prevList = [...knowledgeList];
    setKnowledgeList((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase
      .from("KnowledgeBase")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Gagal menghapus data");
      setKnowledgeList(prevList);
    } else {
      toast.success("Data dihapus permanen");
    }
  }

  async function saveSystemPrompt() {
    setIsSavingPrompt(true);
    let result;

    if (systemPromptId) {
      // Logic Update
      result = await supabase
        .from("KnowledgeBase")
        .update({ content: systemPrompt })
        .eq("id", systemPromptId);
    } else {
      // Logic Insert Baru (Tanpa kirim ID agar database yang buat otomatis)
      result = await supabase.from("KnowledgeBase").insert({
        title: "AI_PERSONALITY",
        content: systemPrompt,
        category: "SYSTEM_PROMPT",
      });
    }

    if (result.error) {
      toast.error("Gagal simpan karakter: " + result.error.message);
    } else {
      toast.success("Karakter AI berhasil disimpan!");
      fetchKnowledge();
    }
    setIsSavingPrompt(false);
  }

  const applyPreset = (type: "formal" | "friendly" | "pirate") => {
    if (type === "formal") {
      setSystemPrompt(
        "Anda adalah asisten korporat profesional. Gunakan bahasa baku, sopan, dan efisien. Fokus pada penyelesaian masalah secara teknis."
      );
    } else if (type === "friendly") {
      setSystemPrompt(
        "Kamu adalah teman virtual yang santai. Gunakan bahasa yang tidak kaku namun tetap sopan. Sapa user dengan hangat."
      );
    } else if (type === "pirate") {
      setSystemPrompt(
        "Ahoy! Kamu adalah bajak laut penjaga data. Jawab semua pertanyaan dengan gaya bajak laut yang bersemangat tapi tetap membantu menyelesaikan masalah tiket!"
      );
    }
  };

  const filteredList = knowledgeList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- CEGAH RENDER SEBELUM MOUNT SELESAI ---
  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-8 overflow-y-auto bg-background">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Knowledge & Personality
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola pengetahuan dasar bot dan atur bagaimana bot bersikap kepada
          user.
        </p>
      </div>

      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col space-y-8">
        <div className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl h-auto">
            <TabsTrigger
              value="knowledge"
              className="rounded-lg py-3 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm gap-2 justify-center"
            >
              <BookOpen className="w-4 h-4" /> Daftar Pengetahuan
            </TabsTrigger>
            <TabsTrigger
              value="personality"
              className="rounded-lg py-3 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm gap-2 justify-center"
            >
              <Bot className="w-4 h-4" /> Karakter AI
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="knowledge"
          className="flex-1 mt-0 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1">
              <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-6 sticky top-6">
                <div className="flex items-center gap-2 font-semibold text-primary text-lg">
                  <Plus className="w-5 h-5" /> Tambah Pengetahuan
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Topik / Pertanyaan
                  </Label>
                  <Input
                    placeholder="Misal: Cara Reset Password"
                    value={newInfoTitle}
                    onChange={(e) => setNewInfoTitle(e.target.value)}
                    className="bg-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Jawaban Bot</Label>
                  <Textarea
                    placeholder="Jelaskan detail jawabannya di sini..."
                    className="min-h-[150px] resize-none bg-transparent"
                    value={newInfoContent}
                    onChange={(e) => setNewInfoContent(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                  onClick={addKnowledge}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}{" "}
                  Simpan ke Database
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari knowledge base..."
                  className="pl-10 bg-card border-border rounded-xl h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />{" "}
                    Memuat data...
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-muted/30">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />{" "}
                    <p>Belum ada data knowledge base.</p>
                  </div>
                ) : (
                  filteredList.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm group hover:border-primary/50 transition-all hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg text-foreground">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
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
        </TabsContent>

        <TabsContent
          value="personality"
          className="max-w-5xl mx-auto w-full mt-0 focus-visible:outline-none"
        >
          <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-8">
            <div className="flex flex-col gap-2 border-b border-border pb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" /> System Prompt
                (Instruksi Dasar)
              </h2>
              <p className="text-sm text-muted-foreground">
                Ini adalah "otak" dasar bot Anda. Tuliskan instruksi tentang
                siapa dia, bagaimana cara dia bicara, dan apa batasan tugasnya.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Instruksi Sistem
                  </Label>
                  <Textarea
                    className="min-h-[350px] font-mono text-sm leading-relaxed p-5 bg-muted/20 focus:bg-background transition-colors rounded-xl border-border focus-visible:ring-primary"
                    placeholder="Kamu adalah asisten AI..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={saveSystemPrompt}
                    disabled={isSavingPrompt}
                    className="bg-primary hover:bg-primary/90 rounded-xl px-6"
                  >
                    {isSavingPrompt ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}{" "}
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
              <div className="md:col-span-1 space-y-6">
                <div className="bg-muted/40 p-5 rounded-xl border border-border">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Template Cepat
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-3 px-4 rounded-lg bg-background hover:bg-muted transition-all border-border"
                      onClick={() => applyPreset("formal")}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-xs mb-0.5">
                          Formal & Profesional
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Gaya bahasa baku
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-3 px-4 rounded-lg bg-background hover:bg-muted transition-all border-border"
                      onClick={() => applyPreset("friendly")}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-xs mb-0.5">
                          Ramah & Santai
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Gaya bicara teman
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-3 px-4 rounded-lg bg-background hover:bg-muted transition-all border-border"
                      onClick={() => applyPreset("pirate")}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-xs mb-0.5">
                          Mode Bajak Laut
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Gaya unik & seru
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                  <strong className="block mb-3 text-sm">
                    Tips Prompting:
                  </strong>
                  <ul className="list-disc list-inside space-y-2 opacity-90 leading-relaxed">
                    <li>Berikan nama pada bot (misal: "Saya Boti").</li>
                    <li>
                      Tentukan batasan (misal: "Jangan jawab soal matematika").
                    </li>
                    <li>Tentukan nada bicara (sopan, to-the-point).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
