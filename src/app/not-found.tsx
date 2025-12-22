"use client";

import { useEffect, useState } from "react"; // Tambah import ini
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { motion, Variants } from "framer-motion";

// --- KOMPONEN SVG ROBOT ANIMASI ---
const AnimatedRobotSVG = () => {
  const hoverVariant: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const blinkVariant: Variants = {
    animate: {
      scaleY: [1, 0.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        times: [0, 0.9, 1],
        ease: "easeInOut",
      },
    },
  };

  const antennaVariant: Variants = {
    animate: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
      initial="initial"
      animate="animate"
    >
      <motion.g variants={hoverVariant} animate="animate">
        <motion.g
          variants={antennaVariant}
          animate="animate"
          style={{ originX: "100px", originY: "50px" }}
        >
          <line
            x1="100"
            y1="50"
            x2="100"
            y2="20"
            stroke="#52525b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="20" r="6" fill="#ef4444">
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </motion.g>

        <rect
          x="60"
          y="50"
          width="80"
          height="70"
          rx="12"
          fill="#27272a"
          stroke="#52525b"
          strokeWidth="4"
        />
        <rect x="70" y="65" width="60" height="35" rx="5" fill="#18181b" />

        <motion.g
          variants={blinkVariant}
          animate="animate"
          style={{ originY: "82px" }}
        >
          <line
            x1="78"
            y1="75"
            x2="92"
            y2="90"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="92"
            y1="75"
            x2="78"
            y2="90"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M115,75 C118,72 125,72 125,78 C125,82 120,84 120,88"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="120" cy="93" r="2" fill="#3b82f6" />
        </motion.g>

        <rect x="90" y="120" width="20" height="10" fill="#52525b" />
        <path
          d="M 70 130 L 130 130 L 115 160 L 85 160 Z"
          fill="#27272a"
          stroke="#52525b"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </motion.g>

      <motion.ellipse
        cx="100"
        cy="180"
        rx="40"
        ry="10"
        fill="#000"
        opacity="0.3"
        animate={{
          scaleX: [1, 0.8, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
};

// --- FIXED: BACKGROUND PARTIKEL ANIMASI ---
const FloatingParticles = () => {
  // Definisi tipe data state
  const [particles, setParticles] = useState<
    Array<{
      width: string;
      height: string;
      top: string;
      left: string;
      duration: number;
      delay: number;
    }>
  >([]);

  // Generate random values HANYA di client (useEffect)
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map(() => ({
      width: Math.random() * 20 + 5 + "px",
      height: Math.random() * 20 + 5 + "px",
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-zinc-800/50 rounded-sm"
          style={{
            width: p.width,
            height: p.height,
            top: p.top,
            left: p.left,
          }}
          animate={{
            y: [0, -200],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

// --- HALAMAN UTAMA ---
export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 px-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 1. BACKGROUND FULL ANIMASI */}
      <FloatingParticles />

      <div className="absolute inset-0 bg-radial-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none" />

      <div className="max-w-lg w-full text-center space-y-8 relative z-10">
        {/* 2. SVG ROBOT ANIMASI TOTAL */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="flex justify-center"
        >
          <AnimatedRobotSVG />
        </motion.div>

        {/* 3. TEKS ANIMASI BERNAFAS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <motion.h1
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 drop-shadow-sm"
          >
            404
          </motion.h1>
          <h2 className="text-2xl font-semibold text-zinc-300">
            Sistem Kehilangan Arah
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed font-mono bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
            &gt; Error: Halaman yang diminta tidak dapat ditemukan di database
            kami. Robot kami sedang kebingungan.
          </p>
        </motion.div>

        {/* 4. TOMBOL ANIMASI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
        >
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 font-bold relative overflow-hidden group"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Kembali ke Beranda</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 bg-transparent hover:border-zinc-600 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Mundur Satu Langkah
          </Button>
        </motion.div>
      </div>

      {/* Footer Terminal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 text-[10px] text-zinc-700 font-mono flex items-center gap-2"
      >
        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        VIBE_CODER_SYSTEM // STATUS: CRITICAL_MISSING
      </motion.div>
    </div>
  );
}
