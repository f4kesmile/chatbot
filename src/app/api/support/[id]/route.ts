import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmailNotification } from "@/lib/email";
import { getSupportEmailTemplate } from "@/lib/email-templates";

// GET: Baca Detail Tiket
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        replies: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!ticket) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    if (ticket.userId === user.id) {
      if (!ticket.isReadByUser) {
        await prisma.supportTicket.update({ where: { id }, data: { isReadByUser: true } });
      }
    } else {
      if (!ticket.isReadByAdmin) {
        await prisma.supportTicket.update({ where: { id }, data: { isReadByAdmin: true } });
      }
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: Kirim Balasan
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const senderAvatar = user?.user_metadata?.avatar_url || null;
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message, senderRole } = body; 

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true }
    });
    
    let senderName = dbUser?.name || dbUser?.email?.split('@')[0] || "Unknown";
    if (senderRole === "ADMIN" && !dbUser?.name) {
        senderName = "Tim Admin"; 
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        message: message,
        sender: senderRole,
        senderName: senderName,
        senderAvatar: senderAvatar,
      }
    });

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });

    if (senderRole === "ADMIN") {
      await prisma.supportTicket.update({
        where: { id },
        data: { 
            status: "IN_PROGRESS", 
            isReadByUser: false, 
            updatedAt: new Date() 
        }
      });

      if (ticket?.email) {
        const emailHtml = getSupportEmailTemplate(
          "Balasan dari Admin Support",
          `Admin membalas tiket <b>"${ticket.subject}"</b>:<br/><br/>"<i>${message}</i>"`,
          `${process.env.NEXT_PUBLIC_APP_URL}/tickets`
        );
        sendEmailNotification({
          to: ticket.email,
          subject: `[Balasan] ${ticket.subject}`,
          html: emailHtml
        });
      }

    } else {
      await prisma.supportTicket.update({
        where: { id },
        data: { 
            isReadByAdmin: false, 
            status: "OPEN", 
            updatedAt: new Date() 
        }
      });

      const adminEmail = process.env.ADMIN_EMAIL_NOTIFICATION;
      if (adminEmail && ticket) {
        const emailHtml = getSupportEmailTemplate(
          "User Membalas Tiket",
          `User <b>${ticket.email}</b> membalas tiket <b>"${ticket.subject}"</b>:<br/><br/>"<i>${message}</i>"`,
          `${process.env.NEXT_PUBLIC_APP_URL}/admin/inbox`
        );
        sendEmailNotification({
          to: adminEmail,
          subject: `[Reply] ${ticket.subject}`,
          html: emailHtml
        });
      }
    }

    return NextResponse.json(reply);

  } catch (error) {
    console.error("Reply Error:", error);
    return NextResponse.json({ error: "Gagal kirim pesan" }, { status: 500 });
  }
}