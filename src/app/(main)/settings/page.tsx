"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Palette,
  Save,
  Loader2,
  Upload,
  X,
  Check,
  ZoomIn,
  Image as ImageIcon,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { eventBus } from "@/utils/events";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [supabase] = useState(() => createClient());
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState("profile");

  // --- PROFILE STATE ---
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- PASSWORD STATE ---
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- AI PREFERENCES STATE ---
  const [customInstructions, setCustomInstructions] = useState("");

  // --- CROPPER STATE ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH USER ---
  useEffect(() => {
    let mounted = true;
    async function getUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted && user) {
        setUser(user);
        const { data: dbUser } = await supabase
          .from("User")
          .select("name, avatar, customInstructions")
          .eq("id", user.id)
          .single();

        setFullName(dbUser?.name || user.user_metadata?.full_name || "");
        setAvatarUrl(dbUser?.avatar || user.user_metadata?.avatar_url || "");
        setCustomInstructions(dbUser?.customInstructions || "");
        setBio(user.user_metadata?.bio || "");
      }
    }
    getUserData();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";

  // --- 2. CROPPER LOGIC ---
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/"))
        return toast.error("File harus gambar");
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    try {
      setIsUpdatingProfile(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Gagal crop gambar");

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const fileToUpload = new File([croppedImageBlob], fileName, {
        type: "image/jpeg",
      });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileToUpload, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await supabase
        .from("User")
        .update({ avatar: publicUrl })
        .eq("id", user.id);

      setAvatarUrl(publicUrl);
      toast.success("Foto profil berhasil diperbarui!");
      eventBus.emit("userUpdated");
      setIsCropDialogOpen(false);
      setImageSrc(null);
      setZoom(1);
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal upload foto.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- 3. UPDATES ---
  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: fullName, bio: bio },
      });
      await supabase.from("User").update({ name: fullName }).eq("id", user.id);
      toast.success("Profil diperbarui!");
      eventBus.emit("userUpdated");
    } catch (e) {
      toast.error("Gagal update profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6)
      return toast.warning("Password min 6 karakter");
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password berhasil diubah!");
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateAI = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await supabase
        .from("User")
        .update({ customInstructions: customInstructions })
        .eq("id", user.id);
      toast.success("Preferensi AI disimpan!");
    } catch {
      toast.error("Gagal simpan preferensi.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const TABS = [
    { id: "profile", label: "Profil", icon: User },
    { id: "account", label: "Akun", icon: Lock },
    { id: "appearance", label: "Tampilan", icon: Palette },
    { id: "ai_preferences", label: "AI Prefs", icon: Bot },
  ];

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-10 overflow-y-auto bg-background pb-24 md:pb-10">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Kelola preferensi akun, tampilan, dan kepribadian AI.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 max-w-4xl w-full mx-auto"
      >
        {/* --- CUSTOM TABS NAVIGATION (SMART FLEX LAYOUT) --- */}
        <div className="w-full mb-8">
          {/* Container: Menggunakan FLEX agar dinamis, bukan Grid */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200 dark:border-zinc-700/50 w-full">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out",

                    // --- LOGIKA LEBAR ---
                    // Mobile: Tab Aktif dapet jatah flex-[3] (lebih lebar), yang lain flex-1.
                    // Desktop (md): Semua rata flex-1.
                    isActive ? "flex-[3] md:flex-1" : "flex-1",

                    // --- STYLE VISUAL ---
                    isActive
                      ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-white/5"
                  )}
                >
                  <tab.icon
                    size={18}
                    className={cn(isActive && "text-primary")}
                  />

                  {/* --- TEKS LABEL --- */}
                  <span
                    className={cn(
                      "transition-all duration-300 truncate",
                      // Mobile: Teks muncul kalau aktif. Desktop: Selalu muncul.
                      isActive
                        ? "inline-block opacity-100 max-w-[150px]"
                        : "hidden md:inline-block md:opacity-100 w-0 md:w-auto"
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- TAB CONTENTS --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* TAB PROFIL */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-muted">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="font-bold text-xl">Foto Profil</h3>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={onSelectFile}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 rounded-xl"
                      disabled={isUpdatingProfile}
                    >
                      <Upload className="w-4 h-4" /> Upload Foto
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    placeholder="Nama Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Bio Singkat</Label>
                  <Input
                    placeholder="Contoh: Software Engineer"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8 border-t pt-6">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="gap-2 rounded-xl px-6"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          )}

          {/* TAB AKUN */}
          {activeTab === "account" && (
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted opacity-70 rounded-xl"
                  />
                </div>
                <div className="grid gap-2 pt-4 border-t">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-8 border-t pt-6">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="gap-2 rounded-xl px-6"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {/* TAB TAMPILAN */}
          {activeTab === "appearance" && (
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-lg">Mode Gelap</h3>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan tema gelap untuk kenyamanan mata.
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
              </div>
            </div>
          )}

          {/* TAB AI PREFS */}
          {activeTab === "ai_preferences" && (
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Instruksi Khusus</h3>
                  <p className="text-sm text-muted-foreground">
                    Berikan instruksi tentang gaya bicara, format jawaban, atau
                    peran AI.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Textarea
                    className="flex min-h-[150px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Contoh: 'Jawablah dengan singkat dan santai. Gunakan bahasa gaul sedikit.'"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI akan mengingat instruksi ini di setiap percakapan baru.
                  </p>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleUpdateAI}
                    disabled={isUpdatingProfile}
                    className="gap-2 rounded-xl px-6"
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Simpan Preferensi
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- DIALOG CROPPER --- */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-zinc-950 text-white rounded-3xl">
          <DialogHeader className="p-6 pb-2 bg-zinc-900/50 backdrop-blur-xl border-b border-white/10 z-10">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-primary" /> Sesuaikan Foto
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Geser dan zoom untuk mendapatkan potongan terbaik.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[350px] bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <div className="p-6 bg-zinc-900 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" /> Zoom
                </span>
                <span>{(zoom * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(v) => setZoom(v[0])}
                className="cursor-pointer"
              />
            </div>
            <DialogFooter className="flex gap-3 sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => setIsCropDialogOpen(false)}
                disabled={isUpdatingProfile}
                className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" /> Batal
              </Button>
              <Button
                onClick={uploadCroppedImage}
                disabled={isUpdatingProfile}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 font-semibold"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}{" "}
                Simpan Foto
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
