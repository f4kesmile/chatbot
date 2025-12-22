import { createClient } from "@/utils/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function requireAdmin() {
  const supabase = await createClient();
  
  // 1. Cek User Login di Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  // 2. Cek Role Asli di Database (Prisma)
  // Kita cari user di tabel public berdasarkan ID dari auth
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }, // Cuma ambil kolom role biar ringan
  });

  // 3. Tendang jika bukan Admin
  // Pastikan string "admin" ini sama persis dengan yang kamu set di database nanti
  if (!dbUser || dbUser.role !== "admin") {
    return redirect("/"); // Balikin ke home kalau nakal
  }

  return user; // Kalau lolos, kembalikan data user
}