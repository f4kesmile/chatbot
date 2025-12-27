import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. AUTH & SECURITY CHECK
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized: Sesi Anda telah berakhir. Silakan login kembali." }, 
        { status: 401 }
      );
    }

    // 2. PARSE & VALIDATE INPUT
    const body = await req.json();
    const { subject, message } = body;

    // Sanitasi input (hapus spasi depan/belakang)
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

    // 3. DATABASE TRANSACTION
    // Kita set isReadByAdmin = false agar muncul notifikasi/bold di Admin
    const newTicket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        email: user.email,
        subject: cleanSubject,
        message: cleanMessage,
        status: "OPEN",
        isReadByAdmin: false, // PENTING: Notifikasi untuk Admin
        isReadByUser: true,   // User sudah baca karena dia yang buat
      }
    });

    return NextResponse.json({ 
      success: true, 
      ticketId: newTicket.id,
      message: "Tiket berhasil dibuat." 
    });

  } catch (error: any) {
    // 4. GLOBAL ERROR HANDLING
    console.error("[API_SUPPORT_CREATE_ERROR]", error);
    
    // Menangani error spesifik Prisma (misal koneksi putus)
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Terjadi duplikasi data." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi nanti." }, 
      { status: 500 }
    );
  }
}