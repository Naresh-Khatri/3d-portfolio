"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { quotes, shuffleArray, type Quote } from "@/data/articles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote, ArrowLeft } from "lucide-react";
import RevealAnimation from "@/components/reveal-animations";
import AnimatedBackground from "@/components/animated-background";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils";

// Deterministic random function for selecting quotes
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export default function QuotesPage() {
  const shuffledQuotes = useMemo(() => shuffleArray(quotes), []);
  
  const { displayedItems, hasMore, loadMoreRef } = useInfiniteScroll(
    shuffledQuotes,
    {
      initialCount: 30, // Load initial batch
      loadMoreCount: 30, // Load more in batches
    }
  );
  
  // Get two random quotes for the left side using deterministic selection
  const randomQuotes = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    const random = seededRandom(seed + 12345); // Different seed for random selection
    
    const indices = new Set<number>();
    while (indices.size < 2 && indices.size < displayedItems.length) {
      indices.add(Math.floor(random() * displayedItems.length));
    }
    return Array.from(indices).map(i => displayedItems[i]);
  }, [displayedItems]);

  return (
    <div className="min-h-screen relative font-sans">
      <div className="top-0 z-0 fixed w-full h-screen">
        <AnimatedBackground />
      </div>
      
      <div className="container mx-auto px-4 py-24 min-h-screen relative z-10">
        <RevealAnimation>
          <Link
            href="/"
            className="inline-flex items-center text-zinc-500 hover:text-purple-400 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </RevealAnimation>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar with Keyboard Animation and Random Quotes */}
          <div className="lg:col-span-1">
            <RevealAnimation>
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquareQuote className="w-6 h-6 text-purple-500" />
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Quotes
                  </h1>
                </div>
                
                <p className="text-zinc-400 text-sm mb-8">
                  An unorganized and continuously growing archive of quotes, ideas, and works that influence or represent my thought in some way across a wide range of topics.
                </p>

                {/* Two Random Quotes */}
                {randomQuotes.map((quote, index) => (
                  <RevealAnimation key={`random-${quote.id}`} delay={index * 0.1}>
                    <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm hover:border-purple-500/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">
                          {quote.author || "Anonymous"}
                        </CardTitle>
                        {quote.category && (
                          <CardDescription className="text-xs">
                            {quote.category}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm italic text-zinc-300">
                          &ldquo;{quote.text}&rdquo;
                        </p>
                        {quote.source && (
                          <p className="text-xs text-zinc-500 mt-2">{quote.source}</p>
                        )}
                      </CardContent>
                    </Card>
                  </RevealAnimation>
                ))}
              </div>
            </RevealAnimation>
          </div>

          {/* Right Side - All Quotes Grid (Blog-style layout) */}
          <div className="lg:col-span-2">
            <RevealAnimation delay={0.1}>
              <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                To maximize each item&apos;s exposure, the order of quotes is randomly reordered each day.
              </p>
            </RevealAnimation>

            <div className="flex flex-wrap gap-6">
              {displayedItems.map((quote, index) => (
                <RevealAnimation key={quote.id} delay={0} className="w-full md:max-w-[calc(50%-0.75rem)] lg:max-w-[calc(33.333%-1rem)] md:flex-[1_1_auto]">
                  <Card className="h-full bg-black/40 border-zinc-800 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-lg group">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        {quote.category && (
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                            {quote.category}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-medium group-hover:text-purple-400 transition-colors">
                        {quote.author || "Anonymous"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic text-zinc-300 leading-relaxed">
                        &ldquo;{quote.text}&rdquo;
                      </p>
                      {quote.source && (
                        <p className="text-xs text-zinc-500 mt-3 italic">
                          {quote.source}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </RevealAnimation>
              ))}
            </div>

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                <div className="text-zinc-500 text-sm">Loading more quotes...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

