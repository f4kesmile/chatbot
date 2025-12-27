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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [supabase] = useState(() => createClient());
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // --- PROFILE STATE ---
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- PASSWORD STATE ---
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- CROPPER STATE ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH USER ---
  useEffect(() => {
    let mounted = true;
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted && user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || "");
        setBio(user.user_metadata?.bio || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
      }
    }
    getUser();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";

  // --- 1. PILIH FILE & BUKA CROPPER ---
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/"))
        return toast.error("File harus berupa gambar");

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // --- 2. SIMPAN POSISI CROP ---
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // --- 3. PROSES UPLOAD ---
  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;

    try {
      setIsUpdatingProfile(true);

      // A. Potong Gambar
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Gagal memotong gambar");

      // B. Upload ke Supabase Storage
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const fileToUpload = new File([croppedImageBlob], fileName, {
        type: "image/jpeg",
      });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      // C. Dapatkan URL Publik
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // D. Update Metadata User Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      // E. Update State & Broadcast Event
      setAvatarUrl(publicUrl);
      toast.success("Foto profil berhasil diperbarui!");
      eventBus.emit("userUpdated");

      setIsCropDialogOpen(false);
      setImageSrc(null);
      setZoom(1);
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal mengupload foto.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, bio: bio },
      });
      if (error) throw error;
      toast.success("Profil diperbarui!");
      eventBus.emit("userUpdated");
    } catch (error: any) {
      toast.error(error.message);
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 md:p-10 space-y-8 overflow-y-auto bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola preferensi akun dan tampilan aplikasi.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <Tabs defaultValue="profile" className="w-full max-w-4xl">
          {/* PERBAIKAN: Mengembalikan styling active state */}
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="profile"
              className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4" /> Profil
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Lock className="w-4 h-4" /> Akun
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="w-4 h-4" /> Tampilan
            </TabsTrigger>
          </TabsList>

          {/* --- TAB PROFIL --- */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Foto Profil</h3>
                  <div className="flex gap-2">
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
                      className="gap-2"
                      disabled={isUpdatingProfile}
                    >
                      <Upload className="w-4 h-4" /> Upload Foto
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG. Maks 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    placeholder="Nama Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Bio Singkat</Label>
                  <Input
                    placeholder="Contoh: Software Engineer"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8 border-t pt-6">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="gap-2"
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
          </TabsContent>

          {/* --- TAB AKUN --- */}
          <TabsContent value="account" className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted opacity-70"
                  />
                </div>
                <div className="grid gap-2 pt-4 border-t">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-8 border-t pt-6">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="gap-2"
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
          </TabsContent>

          {/* --- TAB TAMPILAN --- */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Mode Gelap</h3>
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
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* --- DIALOG CROPPER (MODERN UI) --- */}
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

          {/* CROPPER AREA */}
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

          {/* CONTROLS */}
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
                )}
                Simpan Foto
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
