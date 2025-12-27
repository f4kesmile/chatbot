import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (typeof body.isReadByAdmin === "boolean") updateData.isReadByAdmin = body.isReadByAdmin;
    if (typeof body.isReadByUser === "boolean") updateData.isReadByUser = body.isReadByUser;
    if (body.status) updateData.status = body.status;

    await prisma.supportTicket.update({
        where: { id },
        data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}