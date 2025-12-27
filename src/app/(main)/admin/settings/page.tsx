"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Save,
  Loader2,
  Briefcase,
  Coffee,
  Smile,
  ShieldAlert,
  Megaphone,
  Sparkles,
  Settings2,
  BrainCircuit,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    maintenanceMode: false,
    botTone: "FORMAL",
    handoffMessage: "",
    broadcastMessage: "",
  });

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from("SiteConfig")
      .select("*")
      .eq("id", "config")
      .single();
    if (data) setConfig(data as any);
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function saveConfig() {
    setLoading(true);
    const { error } = await supabase
      .from("SiteConfig")
      .upsert({ id: "config", ...config });
    setLoading(false);
    if (!error) {
      toast.success("Konfigurasi sistem berhasil diperbarui", {
        description:
          "Perubahan akan segera diterapkan pada seluruh sesi pengguna.",
      });
    } else {
      toast.error("Gagal menyimpan konfigurasi");
    }
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3 text-blue-600">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Site Settings
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Konfigurasi pusat operasional dan kecerdasan buatan untuk mengontrol
          perilaku sistem secara global.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Personality Card */}
          <Card className="border-none ring-1 ring-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b py-4">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-blue-600" />
                <CardTitle className="text-base font-semibold">
                  AI Personality & Behavior
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Atur bagaimana asisten virtual berinteraksi dengan pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="bot-tone" className="text-sm font-medium">
                  Gaya Komunikasi
                </Label>
                <Select
                  value={config.botTone}
                  onValueChange={(v) => setConfig({ ...config, botTone: v })}
                >
                  <SelectTrigger
                    id="bot-tone"
                    className="rounded-xl h-11 border-border focus:ring-blue-500"
                  >
                    <SelectValue placeholder="Pilih gaya bicara" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="FORMAL" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-600" />{" "}
                        <span>Profesional & Formal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CASUAL" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coffee size={14} className="text-orange-500" />{" "}
                        <span>Ramah & Santai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HUMOR" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smile size={14} className="text-green-500" />{" "}
                        <span>Humoris & Ceria</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="handoff" className="text-sm font-medium">
                    Pesan Kegagalan (Handoff)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Dikirim saat AI tidak mampu menjawab permintaan pengguna.
                  </span>
                </div>
                <Textarea
                  id="handoff"
                  value={config.handoffMessage}
                  onChange={(e) =>
                    setConfig({ ...config, handoffMessage: e.target.value })
                  }
                  placeholder="Contoh: Mohon maaf, saya memerlukan bantuan admin untuk menjawab ini..."
                  className="rounded-xl min-h-[100px] bg-muted/20 border-border focus-visible:ring-blue-500 p-4 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Broadcast Card */}
          <Card className="border-none ring-1 ring-border shadow-sm rounded-2xl">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b py-4">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-blue-600" />
                <CardTitle className="text-base font-semibold">
                  Broadcast Banner
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Pengumuman global yang akan muncul di dashboard seluruh
                pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Tulis pengumuman penting di sini..."
                value={config.broadcastMessage}
                onChange={(e) =>
                  setConfig({ ...config, broadcastMessage: e.target.value })
                }
                className="rounded-xl min-h-[80px] bg-background border-border focus-visible:ring-blue-500 p-4"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Maintenance Control */}
          <Card
            className={`rounded-2xl border-none ring-1 transition-all duration-300 ${
              config.maintenanceMode
                ? "ring-red-500 bg-red-50/50 dark:bg-red-950/20"
                : "ring-border bg-background"
            }`}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div
                  className={`p-2 rounded-lg ${
                    config.maintenanceMode
                      ? "bg-red-100 text-red-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <ShieldAlert size={20} />
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, maintenanceMode: v })
                  }
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Mode Pemeliharaan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Jika aktif, seluruh akses ke fitur AI akan dibatasi sementara
                  untuk pengguna publik.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Action */}
          <div className="sticky top-6">
            <Button
              onClick={saveConfig}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Simpan Konfigurasi
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-3 italic">
              Pastikan Anda telah meninjau semua perubahan sebelum menyimpan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
