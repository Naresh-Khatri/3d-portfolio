import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotFoundMeme from "@/components/not-found-meme";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-6 pb-16 pt-32 text-center">
      <p className="font-display text-7xl font-bold tracking-tight sm:text-8xl" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold sm:text-2xl">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
        This page disappeared. Or maybe it never existed.
      </p>
      <div className="mt-8 w-full max-w-[426px]">
        <NotFoundMeme />
      </div>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
    </main>
  );
}
