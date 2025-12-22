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
import {
  Save,
  Loader2,
  Briefcase,
  Coffee,
  Smile,
  Settings2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Hanya State Config yang tersisa (Bersih)
  const [config, setConfig] = useState({
    maintenanceMode: false,
    botTone: "FORMAL",
    handoffMessage: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    const { data } = await supabase
      .from("SiteConfig")
      .select("*")
      .eq("id", "config")
      .single();
    if (data) setConfig(data);
  }

  async function saveConfig() {
    setLoading(true);
    const toastId = toast.loading("Menyimpan konfigurasi...");

    const { error } = await supabase.from("SiteConfig").upsert({
      id: "config",
      maintenanceMode: config.maintenanceMode,
      botTone: config.botTone,
      handoffMessage: config.handoffMessage,
    });

    setLoading(false);

    if (!error) {
      toast.success("Konfigurasi berhasil disimpan!", { id: toastId });
    } else {
      toast.error("Gagal menyimpan konfigurasi.", { id: toastId });
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-background">
      {/* HEADER PAGE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-sm">
            Kontrol pusat perilaku dan kepribadian AI.
          </p>
        </div>
      </div>

      {/* CONTAINER CARD UTAMA */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-full flex flex-col">
        {/* Header Kecil dalam Card */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Konfigurasi Bot</h2>
            <p className="text-xs text-muted-foreground">
              Sesuaikan bagaimana bot berinteraksi dengan user.
            </p>
          </div>
        </div>

        {/* ISI FORM */}
        <div className="flex-1 p-6 space-y-8 max-w-4xl">
          {/* 1. Maintenance Mode */}
          <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-muted/5">
            <div className="space-y-1">
              <Label className="text-base font-semibold">
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Jika aktif, bot akan berhenti menjawab dan mengirim pesan
                perbaikan.
              </p>
            </div>
            <Switch
              checked={config.maintenanceMode}
              onCheckedChange={(val) =>
                setConfig({ ...config, maintenanceMode: val })
              }
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* 2. Tone Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Gaya Bicara AI (Tone)
              </Label>
              <Select
                value={config.botTone}
                onValueChange={(val) => setConfig({ ...config, botTone: val })}
              >
                <SelectTrigger className="w-full h-12 bg-transparent border-border">
                  <SelectValue placeholder="Pilih tone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL">
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" /> Formal &
                      Profesional
                    </span>
                  </SelectItem>
                  <SelectItem value="CASUAL">
                    <span className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-orange-500" /> Santai &
                      Gaul
                    </span>
                  </SelectItem>
                  <SelectItem value="HUMOR">
                    <span className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-green-500" /> Humoris &
                      Ceria
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Menentukan seberapa santai bot merespons user.
              </p>
            </div>

            {/* 3. Handoff Message (Full Width di Mobile, Separuh di Desktop) */}
            <div className="space-y-3 md:col-span-2">
              <Label className="text-base font-semibold">
                Pesan Fallback (Tidak Tahu)
              </Label>
              <Textarea
                value={config.handoffMessage}
                onChange={(e) =>
                  setConfig({ ...config, handoffMessage: e.target.value })
                }
                className="resize-none h-32 bg-transparent border-border"
                placeholder="Contoh: Maaf, saya belum memiliki informasi mengenai hal tersebut. Silakan hubungi admin."
              />
              <p className="text-xs text-muted-foreground">
                Pesan ini akan muncul ketika bot tidak menemukan jawaban di
                Knowledge Base.
              </p>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-6 border-t border-border mt-4">
            <Button
              onClick={saveConfig}
              disabled={loading}
              size="lg"
              className="min-w-[150px]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
