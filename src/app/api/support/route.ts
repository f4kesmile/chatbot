import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmailNotification } from "@/lib/email";
import { getSupportEmailTemplate } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized: Sesi Anda telah berakhir. Silakan login kembali." }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subject, message } = body;

    const cleanSubject = subject?.trim();
    const cleanMessage = message?.trim();

    if (!cleanSubject || !cleanMessage) {
      return NextResponse.json(
        { error: "Validasi Gagal: Subjek dan Pesan tidak boleh kosong." }, 
        { status: 400 }
      );
    }

    if (cleanMessage.length < 10) {
      return NextResponse.json(
        { error: "Pesan Terlalu Pendek: Mohon jelaskan masalah Anda minimal 10 karakter." }, 
        { status: 400 }
      );
    }

    const newTicket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        email: user.email,
        subject: cleanSubject,
        message: cleanMessage,
        status: "OPEN",
        isReadByAdmin: false,
        isReadByUser: true,
      }
    });

    const adminEmail = process.env.ADMIN_EMAIL_NOTIFICATION;
    if (adminEmail) {
      const emailHtml = getSupportEmailTemplate(
        "Tiket Support Baru",
        `User <b>${user.email}</b> membuat tiket:<br/><br/>"<i>${cleanMessage}</i>"`,
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/inbox`
      );
      sendEmailNotification({
        to: adminEmail,
        subject: `[Support] Tiket Baru: ${cleanSubject}`,
        html: emailHtml
      });
    }

    return NextResponse.json({ 
      success: true, 
      ticketId: newTicket.id,
      message: "Tiket berhasil dibuat." 
    });

  } catch (error: any) {
    console.error("[API_SUPPORT_CREATE_ERROR]", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Terjadi duplikasi data." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi nanti." }, 
      { status: 500 }
    );
  }
}