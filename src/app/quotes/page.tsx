"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { quotes, shuffleArray, type Quote, getArticleImage, BETTER_AI_IMAGES } from "@/data/articles";
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

// Type for mixed content (quote or image)
type MixedContent = 
  | { type: "quote"; data: Quote }
  | { type: "image"; data: { id: string; src: string } };

// Function to interleave quotes with images - uses all available images
// Ensures at least one quote between each image
function interleaveQuotesWithImages(quotesArray: Quote[]): MixedContent[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
  const random = seededRandom(seed + 99999); // Different seed for image selection
  
  // Use all images from BETTER_AI_IMAGES
  const allImages = [...BETTER_AI_IMAGES];
  
  // Shuffle images deterministically
  const shuffledImages = [...allImages];
  for (let i = shuffledImages.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]];
  }
  
  const mixed: MixedContent[] = [];
  let imageIndex = 0;
  
  // Calculate how many quotes per image to distribute all images evenly
  // Aim for roughly 1 image per 2-3 quotes to use all images
  const quotesPerImage = Math.max(2, Math.floor(quotesArray.length / shuffledImages.length));
  
  quotesArray.forEach((quote, index) => {
    // Always add quote first
    mixed.push({ type: "quote", data: quote });
    
    // Add image after quote, but only if:
    // 1. We haven't reached the end of images
    // 2. The last item in mixed array is a quote (ensures quote before image)
    // 3. We're at the right interval
    const lastItem = mixed[mixed.length - 1];
    const shouldAddImage = imageIndex < shuffledImages.length && 
                          lastItem?.type === "quote" &&
                          index > 0 && (
                            index % quotesPerImage === 0 || 
                            (index % Math.max(1, Math.floor(quotesPerImage * 0.6)) === 0 && random() < 0.4)
                          );
    
    if (shouldAddImage) {
      mixed.push({ 
        type: "image", 
        data: { 
          id: `quote-image-${imageIndex}`, 
          src: shuffledImages[imageIndex] 
        } 
      });
      imageIndex++;
    }
  });
  
  // Add remaining images at the end, ensuring quotes between them
  while (imageIndex < shuffledImages.length) {
    // Check if last item is an image - if so, add a quote first
    const lastItem = mixed[mixed.length - 1];
    if (lastItem?.type === "image" && quotesArray.length > 0) {
      // Use a quote from the array (cycling if needed)
      const quoteIndex = (quotesArray.length - 1 - (shuffledImages.length - imageIndex)) % quotesArray.length;
      const quote = quotesArray[Math.max(0, Math.abs(quoteIndex))];
      mixed.push({ type: "quote", data: quote });
    }
    
    mixed.push({ 
      type: "image", 
      data: { 
        id: `quote-image-${imageIndex}`, 
        src: shuffledImages[imageIndex] 
      } 
    });
    imageIndex++;
  }
  
  return mixed;
}

// Function to distribute items evenly across columns
function distributeItemsAcrossColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array.from({ length: numColumns }, () => []);
  
  // Distribute items sequentially using round-robin to ensure no repetition
  items.forEach((item, index) => {
    const columnIndex = index % numColumns;
    columns[columnIndex].push(item);
  });
  
  return columns;
}

export default function QuotesPage() {
  const shuffledQuotes = useMemo(() => shuffleArray(quotes), []);
  
  // Interleave quotes with images
  const mixedContent = useMemo(() => interleaveQuotesWithImages(shuffledQuotes), [shuffledQuotes]);
  
  const { displayedItems, hasMore, loadMoreRef } = useInfiniteScroll(
    mixedContent,
    {
      initialCount: 60, // Load more initial items for better column distribution
      loadMoreCount: 30, // Load more in batches
    }
  );
  
  // Distribute items across 3 columns for even distribution
  const columns = useMemo(() => {
    const filteredItems = displayedItems.filter((item) => {
      if (item.type === "quote") {
        return item.data && item.data.text && item.data.text.trim().length > 0;
      }
      return true; // Keep all images
    });
    return distributeItemsAcrossColumns(filteredItems, 3);
  }, [displayedItems]);
  
  // Get more random quotes for the left side using deterministic selection
  // Use the full shuffled quotes array, not just displayedItems
  const randomQuotes = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    const random = seededRandom(seed + 12345); // Different seed for random selection
    
    // Use the full shuffled quotes array for left sidebar
    const indices = new Set<number>();
    // Get 6-8 quotes for the left sidebar
    const numQuotes = Math.min(8, shuffledQuotes.length);
    while (indices.size < numQuotes && indices.size < shuffledQuotes.length) {
      indices.add(Math.floor(random() * shuffledQuotes.length));
    }
    return Array.from(indices).map(i => shuffledQuotes[i]);
  }, [shuffledQuotes]);

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

                {/* Random Quotes for Left Sidebar */}
                {randomQuotes.map((quote, index) => (
                  <RevealAnimation key={`random-${quote.id}-${index}`} delay={index * 0.1}>
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
          <div className="lg:col-span-3">
            <RevealAnimation delay={0.1}>
              <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                To maximize each item&apos;s exposure, the order of quotes is randomly reordered each day.
              </p>
            </RevealAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {columns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-6">
                  {column.map((item, itemIndex) => {
                    if (item.type === "image") {
                      return (
                        <div key={`image-${item.data.id}-${columnIndex}-${itemIndex}`}>
                          <RevealAnimation delay={0}>
                            <Card className="h-full bg-black/70 border-zinc-800 backdrop-blur-md hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-lg group overflow-hidden">
                              <div className="relative w-full aspect-video">
                                <Image
                                  src={item.data.src}
                                  alt="AI Art"
                                  fill
                                  className="object-cover rounded-t-lg"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </div>
                            </Card>
                          </RevealAnimation>
                        </div>
                      );
                    } else {
                      const quote = item.data;
                      return (
                        <div key={`quote-${quote.id}-${columnIndex}-${itemIndex}`}>
                          <RevealAnimation delay={0}>
                            <Card className="h-full bg-black/70 border-zinc-800 backdrop-blur-md hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-lg group">
                              <CardHeader>
                                <CardTitle className="text-lg font-medium group-hover:text-purple-400 transition-colors">
                                  {quote.author || "Anonymous"}
                                </CardTitle>
                                {quote.category && (
                                  <CardDescription className="text-xs">
                                    {quote.category}
                                  </CardDescription>
                                )}
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
                        </div>
                      );
                    }
                  })}
                </div>
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