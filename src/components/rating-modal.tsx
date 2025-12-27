"use client";

import React, { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function RatingModal({
  ticketId,
  onComplete,
}: {
  ticketId: string;
  onComplete: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = createClient();

  const submitRating = async () => {
    if (rating === 0) return toast.error("Silakan pilih bintang.");

    const { error } = await supabase
      .from("SupportTicket")
      .update({ rating: rating })
      .eq("id", ticketId);

    if (!error) {
      setIsSubmitted(true);
      setTimeout(onComplete, 2000);
    }
  };

  return (
    <div className="p-6 text-center space-y-4">
      {!isSubmitted ? (
        <>
          <h3 className="font-bold text-lg">Puas dengan jawaban AI?</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hover || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Button onClick={submitRating} className="w-full rounded-xl">
            Kirim Feedback
          </Button>
        </>
      ) : (
        <div className="py-4 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="font-bold">Terima kasih!</p>
        </div>
      )}
    </div>
  );
}
