import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFoundPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
    <p className="text-8xl font-bold tracking-tight" aria-hidden="true">404</p>
    <h1 className="text-2xl font-semibold">Page not found</h1>
    <p className="text-muted-foreground">This page doesn&apos;t exist or has moved.</p>
    <Link href="/" className="underline underline-offset-4">Back to home</Link>
  </main>;
}
