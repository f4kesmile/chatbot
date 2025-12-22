"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors // <--- INI KUNCINYA (Warna Otomatis)
      position="top-center" // <--- POSISI DI ATAS
      closeButton // <--- Tombol Close (Opsional tapi bagus)
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-sans",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Kustomisasi warna spesifik jika richColors kurang pas (Opsional)
          // error: "bg-red-500 text-white border-red-600",
          // success: "bg-green-500 text-white border-green-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
