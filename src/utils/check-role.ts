import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; 

console.log("PRISMA MODULE LOADED FROM:", __filename);

export async function requireAdmin() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }, 
  });

  if (!dbUser || dbUser.role !== "admin") {
    return redirect("/"); 
  }

  return user; 
}