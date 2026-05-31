"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Download, ArrowLeft } from "lucide-react";

// Drop the compiled PDF here: frontend/public/Naresh_Khatri_Resume.pdf
const RESUME_PATH = "/Naresh_Khatri_Resume.pdf";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ResumeView() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hide the global nav on mobile, only while this page is mounted */}
      <style
        dangerouslySetInnerHTML={{
          __html: "@media (max-width: 767px){ header { display: none !important; } }",
        }}
      />

      <div className="container mx-auto px-4 pt-16 pb-24 md:pt-32 max-w-4xl">
        {/* Top bar: back (left) + download (right) */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
          <a
            href={RESUME_PATH}
            download
            className="group inline-flex items-center gap-2 rounded-full bg-[hsl(20,100%,70%)] px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            Download PDF
          </a>
        </motion.div>

        {/* PDF viewer — shown on all screen sizes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="overflow-hidden rounded-2xl border border-border/50"
        >
          <iframe
            src={`${RESUME_PATH}#toolbar=0&navpanes=0&view=FitH`}
            title="Naresh Khatri — Résumé"
            className="h-[85vh] w-full bg-white"
          />
        </motion.div>
      </div>
    </div>
  );
}
