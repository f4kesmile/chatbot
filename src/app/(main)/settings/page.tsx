"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [user, setUser] = React.useState<any>(null);
  const supabase = createClient();

  React.useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex flex-col h-full w-full p-6 md:p-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pengaturan
        </h1>
        <p className="text-muted-foreground">
          Kelola preferensi akun dan tampilan aplikasi Anda.
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <Tabs defaultValue="profile" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="profile"
              className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4 mr-2" /> Profil
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Lock className="w-4 h-4 mr-2" /> Akun
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="w-4 h-4 mr-2" /> Tampilan
            </TabsTrigger>
          </TabsList>

          {/* TAB: PROFILE */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-20 w-20 border-4 border-zinc-100 dark:border-zinc-800">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">Foto Profil</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ini akan ditampilkan di sidebar dan chat.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-zinc-200 dark:border-zinc-700"
                  >
                    Ubah Foto
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Nama Anda"
                    defaultValue={user?.user_metadata?.full_name}
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio Singkat</Label>
                  <Input
                    id="bio"
                    placeholder="Contoh: AI Enthusiast"
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">
                  <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB: ACCOUNT */}
          <TabsContent value="account" className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="bg-zinc-100 dark:bg-zinc-800 border-transparent opacity-70"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Email tidak dapat diubah untuk saat ini.
                  </p>
                </div>

                <div className="grid gap-2 pt-4 border-t border-border">
                  <Label htmlFor="current_password">Password Saat Ini</Label>
                  <Input
                    id="current_password"
                    type="password"
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new_password">Password Baru</Label>
                  <Input
                    id="new_password"
                    type="password"
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">
                  Update Password
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB: APPEARANCE */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Mode Gelap Otomatis</h3>
                  <p className="text-sm text-muted-foreground">
                    Sesuaikan dengan pengaturan sistem perangkat Anda.
                  </p>
                </div>
                <Switch />
              </div>
              <div className="h-px w-full bg-border my-6" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Animasi UI</h3>
                  <p className="text-sm text-muted-foreground">
                    Kurangi animasi untuk performa yang lebih cepat.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
