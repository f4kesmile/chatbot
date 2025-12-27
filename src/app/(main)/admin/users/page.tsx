"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  Shield,
  ShieldAlert,
  User as UserIcon,
  Search,
  RefreshCcw,
  Mail,
  Calendar,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function UserManagementPage() {
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data pengguna");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- LOGIKA UPDATE ROLE DENGAN SONNER & PROTEKSI ---
  const handleUpdateRole = async (
    userId: string,
    currentRole: string,
    newRole: string
  ) => {
    if (currentRole === "super_admin") {
      toast.error("Akses Ditolak", {
        description: "Role Super Admin tidak dapat diubah demi keamanan.",
        icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
      });
      return;
    }

    if (currentRole === newRole) return;

    const toastId = toast.loading("Memperbarui otoritas pengguna...");

    try {
      const { error } = await supabase
        .from("User")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Berhasil diperbarui", {
        id: toastId,
        description: `Status pengguna kini menjadi ${newRole.toUpperCase()}.`,
      });
      fetchUsers();
    } catch (err: any) {
      toast.error("Gagal memperbarui", {
        id: toastId,
        description: err.message || "Terjadi kesalahan database.",
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          User Management
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Kelola hak akses dan pantau profil pengguna dalam sistem.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Cari berdasarkan nama atau email..."
            className="pl-10 rounded-xl bg-background border-border h-12 w-full shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchUsers}
          className="rounded-xl gap-2 h-12 px-6 shadow-sm font-medium"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          Perbarui Data
        </Button>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCcw className="animate-spin mx-auto h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <>
            {/* VIEW DESKTOP: TABLE */}
            <div className="hidden md:block border rounded-2xl bg-background shadow-sm overflow-hidden border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="border-slate-200 dark:border-slate-800">
                    <TableHead className="py-5 px-6 font-semibold">
                      Pengguna
                    </TableHead>
                    <TableHead className="py-5 px-6 font-semibold">
                      Hak Akses
                    </TableHead>
                    <TableHead className="py-5 px-6 font-semibold">
                      Tanggal Daftar
                    </TableHead>
                    <TableHead className="py-5 px-6 text-right font-semibold">
                      Opsi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="group border-slate-100 dark:border-slate-800"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                              <AvatarImage
                                src={user.avatar}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-blue-600 text-white font-bold uppercase">
                                {user.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {user.name || "User"}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={12} /> {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            variant="secondary"
                            className={`rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-widest ${
                              user.role === "super_admin"
                                ? "bg-purple-100 text-purple-700"
                                : ""
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <UserActionsDropdown
                            user={user}
                            onUpdate={(role) =>
                              handleUpdateRole(user.id, user.role, role)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-40 text-center text-muted-foreground"
                      >
                        Data tidak ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* VIEW MOBILE: CARDS */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-blue-50 dark:border-zinc-800">
                            <AvatarImage
                              src={user.avatar}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-600 text-white font-bold">
                              {user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold truncate text-slate-900 dark:text-slate-100">
                              {user.name || "User"}
                            </span>
                            <Badge className="w-fit mt-1 text-[9px] uppercase font-black bg-blue-50 text-blue-700 dark:bg-blue-900/40">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        <UserActionsDropdown
                          user={user}
                          onUpdate={(role) =>
                            handleUpdateRole(user.id, user.role, role)
                          }
                        />
                      </div>
                      <div className="space-y-2 pt-3 border-t border-slate-50 dark:border-slate-800 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-blue-500" />{" "}
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />{" "}
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
                  Data tidak ditemukan
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UserActionsDropdown({
  user,
  onUpdate,
}: {
  user: any;
  onUpdate: (role: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
          <MoreVertical size={20} className="text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-xl w-48 p-1 shadow-xl border-slate-200 dark:border-slate-800"
      >
        <DropdownMenuLabel className="text-[10px] text-muted-foreground px-3 py-2 uppercase font-bold tracking-widest">
          Otoritas
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onUpdate("admin")}
          className="rounded-lg gap-3 py-2.5 cursor-pointer text-sm font-medium focus:bg-blue-50 focus:text-blue-600"
        >
          <Shield size={16} /> Ubah Jadi Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onUpdate("user")}
          className="rounded-lg gap-3 py-2.5 cursor-pointer text-sm font-medium"
        >
          <UserIcon size={16} /> Ubah Jadi User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
