import Spline from "@/components/safe-spline";
import type { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

const NotFoundPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Spline
          scene="/assets/404.spline"
          style={{ height: "100vh" }}
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <h1 className="text-4xl font-bold">404 - Page not found</h1>
              <Link href="/" className="underline">Back to home</Link>
            </div>
          }
        />
      </Suspense>
    </>
  );
};

export default NotFoundPage;
