"use client";

import { useState } from "react";
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
import { Save, Power, Bot } from "lucide-react";

export function QuickSettings() {
  const [maintenance, setMaintenance] = useState(false);
  const [botTone, setBotTone] = useState("formal");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulasi API Call
    setTimeout(() => {
      setLoading(false);
      console.log("Saved:", { maintenance, botTone });
      // Bisa tambah toast notification disini
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-orange-500" />
            <h3 className="font-medium">Maintenance Mode</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Matikan akses publik, hanya admin yang bisa masuk.
          </p>
        </div>
        <Switch
          checked={maintenance}
          onCheckedChange={setMaintenance}
          aria-label="Toggle maintenance mode"
        />
      </div>

      {/* Bot Configuration */}
      <div className="rounded-xl border bg-card text-card-foreground p-6 space-y-4 shadow-sm h-full">
        <div className="flex items-center gap-2 border-b pb-3 mb-3">
          <Bot className="h-4 w-4 text-indigo-500" />
          <h3 className="font-medium">Konfigurasi Bot</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-tone">Gaya Bahasa</Label>
            <Select value={botTone} onValueChange={setBotTone}>
              <SelectTrigger id="bot-tone">
                <SelectValue placeholder="Pilih gaya bahasa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal & Profesional</SelectItem>
                <SelectItem value="santai">Santai & Bersahabat</SelectItem>
                <SelectItem value="humoris">Humoris & Asik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Level Kepercayaan</Label>
            <Select defaultValue="strict">
              <SelectTrigger id="confidence">
                <SelectValue placeholder="Pilih level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict (Aman)</SelectItem>
                <SelectItem value="creative">
                  Creative (Eksperimental)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={handleSave} disabled={loading}>
          {loading ? (
            "Menyimpan..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
