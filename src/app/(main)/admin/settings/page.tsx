"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  Briefcase,
  Coffee,
  Smile,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // State Config
  const [config, setConfig] = useState({
    maintenanceMode: false,
    botTone: "FORMAL",
    handoffMessage: "",
  });

  // State Knowledge Base
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [newInfoTitle, setNewInfoTitle] = useState("");
  const [newInfoContent, setNewInfoContent] = useState("");

  useEffect(() => {
    fetchConfig();
    fetchKnowledge();
  }, []);

  async function fetchConfig() {
    const { data } = await supabase
      .from("SiteConfig")
      .select("*")
      .eq("id", "config")
      .single();
    if (data) setConfig(data);
  }

  async function fetchKnowledge() {
    const { data } = await supabase
      .from("KnowledgeBase")
      .select("*")
      .order("updatedAt", { ascending: false });
    if (data) setKnowledgeList(data);
  }

  async function saveConfig() {
    setLoading(true);
    const { error } = await supabase.from("SiteConfig").upsert({
      id: "config",
      maintenanceMode: config.maintenanceMode,
      botTone: config.botTone,
      handoffMessage: config.handoffMessage,
    });
    setLoading(false);
    if (!error) alert("Konfigurasi tersimpan!");
  }

  async function addKnowledge() {
    if (!newInfoTitle || !newInfoContent) return;
    const { error } = await supabase.from("KnowledgeBase").insert({
      title: newInfoTitle,
      content: newInfoContent,
      category: "INFO",
    });

    if (!error) {
      setNewInfoTitle("");
      setNewInfoContent("");
      fetchKnowledge();
    }
  }

  async function deleteKnowledge(id: string) {
    await supabase.from("KnowledgeBase").delete().eq("id", id);
    fetchKnowledge();
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan AI</h1>
        <p className="text-muted-foreground text-sm">
          Kelola perilaku bot, gaya bahasa, dan basis pengetahuan.
        </p>
      </div>

      {/* Container utama dengan warna 'bg-card' agar selaras dengan tema */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <Tabs defaultValue="config" className="w-full">
          <div className="p-6 border-b">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="config">Perilaku Bot</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: SITE CONFIG */}
          <TabsContent value="config" className="p-6 space-y-8 mt-0">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Bot akan berhenti menjawab chat user jika diaktifkan.
                </p>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(val) =>
                  setConfig({ ...config, maintenanceMode: val })
                }
              />
            </div>

            {/* Bot Tone */}
            <div className="space-y-3">
              <Label>Gaya Bahasa (Tone)</Label>
              <Select
                value={config.botTone}
                onValueChange={(val) => setConfig({ ...config, botTone: val })}
              >
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Pilih gaya bahasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL">
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Formal & Profesional
                    </span>
                  </SelectItem>
                  <SelectItem value="CASUAL">
                    <span className="flex items-center gap-2">
                      <Coffee className="w-4 h-4" /> Santai & Bersahabat
                    </span>
                  </SelectItem>
                  <SelectItem value="HUMOR">
                    <span className="flex items-center gap-2">
                      <Smile className="w-4 h-4" /> Humoris & Seru
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Handoff Message */}
            <div className="space-y-3">
              <Label>Pesan "Tidak Tahu"</Label>
              <Textarea
                value={config.handoffMessage}
                onChange={(e) =>
                  setConfig({ ...config, handoffMessage: e.target.value })
                }
                placeholder="Maaf saya kurang paham..."
                className="resize-none h-24"
              />
              <p className="text-[10px] text-muted-foreground">
                Pesan ini muncul ketika AI tidak menemukan jawaban di Knowledge
                Base.
              </p>
            </div>

            <Button
              onClick={saveConfig}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Simpan Konfigurasi
            </Button>
          </TabsContent>

          {/* TAB 2: KNOWLEDGE BASE */}
          <TabsContent value="knowledge" className="p-6 space-y-6 mt-0">
            {/* Form Tambah */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Topik</Label>
                <Input
                  value={newInfoTitle}
                  onChange={(e) => setNewInfoTitle(e.target.value)}
                  placeholder="Contoh: Jam Operasional"
                />
              </div>
              <div className="space-y-2">
                <Label>Konten Jawaban</Label>
                <Textarea
                  value={newInfoContent}
                  onChange={(e) => setNewInfoContent(e.target.value)}
                  placeholder="Isi jawaban yang harus diketahui bot..."
                  className="h-10 min-h-[40px] resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={addKnowledge}
                  variant="secondary"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Data
                </Button>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* List Data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">
                Daftar Pengetahuan ({knowledgeList.length})
              </h3>
              {knowledgeList.length === 0 && (
                <div className="text-center p-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  Belum ada data knowledge base.
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {knowledgeList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors relative group"
                  >
                    <h4 className="font-bold text-sm mb-1 pr-8">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {item.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteKnowledge(item.id)}
                      className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
