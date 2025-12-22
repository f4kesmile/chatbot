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

export default function QuickSettings() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    maintenanceMode: false,
    botTone: "FORMAL",
    handoffMessage: "",
  });

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
    if (data) {
      setConfig(data);
    }
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
    if (!error) alert("Konfigurasi disimpan!");
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
    <div className="h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold">Bot & Knowledge</h2>
        <p className="text-sm text-muted-foreground">
          Konfigurasi perilaku AI dan konten informasi.
        </p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="config"
              className="rounded-lg py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm"
            >
              Bot Config
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="rounded-lg py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm"
            >
              Knowledge
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SITE CONFIG */}
          <TabsContent value="config" className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bot akan berhenti menjawab chat user.
                </p>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(val) =>
                  setConfig({ ...config, maintenanceMode: val })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Gaya Bahasa Bot</Label>
              <Select
                value={config.botTone}
                onValueChange={(val) => setConfig({ ...config, botTone: val })}
              >
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-950/50 h-10 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Pilih gaya bahasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      <span>Formal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CASUAL">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-orange-500" />
                      <span>Santai</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HUMOR">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-green-500" />
                      <span>Humoris</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Pesan Handoff</Label>
              <Textarea
                value={config.handoffMessage}
                onChange={(e) =>
                  setConfig({ ...config, handoffMessage: e.target.value })
                }
                placeholder="Pesan saat bot tidak tahu jawaban..."
                className="bg-zinc-50 dark:bg-zinc-950/50 min-h-[100px] border-zinc-200 dark:border-zinc-800 resize-none focus-visible:ring-blue-500"
              />
            </div>

            <Button
              onClick={saveConfig}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-medium"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Konfigurasi
            </Button>
          </TabsContent>

          {/* TAB 2: KNOWLEDGE BASE */}
          <TabsContent value="knowledge" className="space-y-6">
            <div className="p-5 border border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/20 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Info Baru
              </h4>
              <Input
                value={newInfoTitle}
                onChange={(e) => setNewInfoTitle(e.target.value)}
                placeholder="Judul (Misal: Jam Operasional)"
                className="bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-800"
              />
              <Textarea
                value={newInfoContent}
                onChange={(e) => setNewInfoContent(e.target.value)}
                placeholder="Isi konten informasi..."
                className="bg-white dark:bg-zinc-900 min-h-[80px] border-blue-200 dark:border-blue-800 resize-none"
              />
              <Button
                size="sm"
                onClick={addKnowledge}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Tambah ke Knowledge Base
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold px-1">Daftar Knowledge Base</h4>
              {knowledgeList.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  Belum ada data tersimpan.
                </p>
              )}
              {knowledgeList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="overflow-hidden pr-4">
                    <p className="font-semibold text-sm truncate text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKnowledge(item.id)}
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
