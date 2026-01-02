import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmailNotification } from "@/lib/email";
import { getSupportEmailTemplate } from "@/lib/email-templates";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.supportTicket.findUnique({ 
        where: { id },
        include: { replies: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!ticket) return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });

    const lastMessage = ticket.replies[0]?.message || ticket.message;

    const emailHtml = getSupportEmailTemplate(
        "Pengingat: Balasan Tiket Support",
        `Halo, ada pesan terkait tiket <b>"${ticket.subject}"</b> yang mungkin Anda lewatkan:<br/><br/>"<i>${lastMessage}</i>"`,
        `${process.env.NEXT_PUBLIC_APP_URL}/tickets`
    );

    const res = await sendEmailNotification({
        to: ticket.email,
        subject: `[Reminder] ${ticket.subject}`,
        html: emailHtml
    });

    if (res.success) {
        return NextResponse.json({ message: "Notifikasi berhasil dikirim ulang." });
    } else {
        throw new Error("Gagal mengirim email via Resend");
    }

  } catch (error) {
    return NextResponse.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}