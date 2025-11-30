"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { quotes, shuffleArray, type Quote, BETTER_AI_IMAGES } from "@/data/articles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquareQuote, ArrowLeft } from "lucide-react";
import RevealAnimation from "@/components/reveal-animations";
import AnimatedBackground from "@/components/animated-background";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

// Deterministic random function
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Content type
type ContentItem =
  | { type: "quote"; data: Quote }
  | { type: "image"; data: { id: string; src: string } };

// Distribute content across 4 columns with images interspersed
function distributeIntoColumns(quotesArray: Quote[]): ContentItem[][] {
  const NUM_COLUMNS = 4;
  const columns: ContentItem[][] = [[], [], [], []];

  // Deterministic shuffle for images
  const today = new Date();
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
  const random = seededRandom(seed);

  const shuffledImages = [...BETTER_AI_IMAGES];
  for (let i = shuffledImages.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]];
  }

  // Distribute quotes evenly across columns first
  const quotesPerColumn = Math.ceil(quotesArray.length / NUM_COLUMNS);

  for (let col = 0; col < NUM_COLUMNS; col++) {
    const startQuoteIndex = col * quotesPerColumn;
    const endQuoteIndex = Math.min((col + 1) * quotesPerColumn, quotesArray.length);
    const columnQuotes = quotesArray.slice(startQuoteIndex, endQuoteIndex);

    // Add all quotes to this column
    columnQuotes.forEach((quote) => {
      columns[col].push({ type: "quote", data: quote });
    });
  }

  // Balance columns BEFORE adding images to ensure consistent base
  const maxQuotes = Math.max(...columns.map(col => col.length));
  columns.forEach((col) => {
    while (col.length < maxQuotes) {
      const randomQuote = quotesArray[Math.floor(random() * quotesArray.length)];
      col.push({ type: "quote", data: randomQuote });
    }
  });

  // Now strategically place images to avoid horizontal adjacency
  // Track image positions: Map<rowIndex, Set<columnIndex>>
  const imagePositions = new Map<number, Set<number>>();

  let imageIndex = 0;
  const imagesPerColumn = Math.ceil(shuffledImages.length / NUM_COLUMNS);

  for (let col = 0; col < NUM_COLUMNS; col++) {
    const targetImages = Math.min(imagesPerColumn, shuffledImages.length - imageIndex);
    const columnLength = columns[col].length;

    for (let imgCount = 0; imgCount < targetImages && imageIndex < shuffledImages.length; imgCount++) {
      // Try to find a position that doesn't conflict with adjacent columns
      let insertPosition = -1;
      const basePosition = Math.floor((columnLength / (targetImages + 1)) * (imgCount + 1));

      // Search for a valid position within a range around the base position
      const searchRange = Math.min(columnLength, Math.max(10, Math.floor(columnLength / targetImages)));

      for (let offset = 0; offset < searchRange; offset++) {
        // Alternate between checking positions above and below the base
        const delta = offset % 2 === 0 ? Math.floor(offset / 2) : -Math.ceil(offset / 2);
        const candidatePos = Math.max(0, Math.min(columnLength, basePosition + delta));

        // Check if adjacent columns have images within ±2 positions (increased buffer)
        let hasAdjacentImage = false;

        for (let checkRow = candidatePos - 2; checkRow <= candidatePos + 2; checkRow++) {
          if (imagePositions.has(checkRow)) {
            const columnsAtRow = imagePositions.get(checkRow)!;
            // Check if any adjacent column has an image at this row
            if (columnsAtRow.has(col - 1) || columnsAtRow.has(col + 1)) {
              hasAdjacentImage = true;
              break;
            }
          }
        }

        if (!hasAdjacentImage) {
          insertPosition = candidatePos;
          break;
        }
      }

      // If no good position found after extensive search, force a position far from others
      if (insertPosition === -1) {
        // Find the position with maximum distance from existing images in adjacent columns
        let maxMinDistance = -1;
        let bestPosition = basePosition;

        for (let pos = 0; pos <= columnLength; pos += Math.max(1, Math.floor(columnLength / 20))) {
          let minDistance = Infinity;

          // Check distance to images in adjacent columns
          for (const [row, cols] of imagePositions) {
            if (cols.has(col - 1) || cols.has(col + 1)) {
              minDistance = Math.min(minDistance, Math.abs(pos - row));
            }
          }

          if (minDistance > maxMinDistance) {
            maxMinDistance = minDistance;
            bestPosition = pos;
          }
        }

        insertPosition = bestPosition;
      }

      // Insert image at the found position
      columns[col].splice(insertPosition, 0, {
        type: "image",
        data: {
          id: `img-${imageIndex}`,
          src: shuffledImages[imageIndex]
        }
      });

      // Track this image position
      if (!imagePositions.has(insertPosition)) {
        imagePositions.set(insertPosition, new Set());
      }
      imagePositions.get(insertPosition)!.add(col);

      imageIndex++;
    }
  }

  return columns;
}

export default function QuotesPage() {
  const shuffledQuotes = useMemo(() => shuffleArray(quotes), []);

  const { displayedItems, hasMore, loadMoreRef } = useInfiniteScroll(
    shuffledQuotes,
    {
      initialCount: 80,
      loadMoreCount: 40,
    }
  );

  // Distribute into 4 equal columns
  const columns = useMemo(() => {
    const validQuotes = displayedItems.filter(q => q && q.text && q.text.trim().length > 0);
    return distributeIntoColumns(validQuotes);
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

        {/* Header */}
        <RevealAnimation>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MessageSquareQuote className="w-8 h-8 text-purple-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Quotes Collection
              </h1>
            </div>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              An unorganized and continuously growing archive of quotes, ideas, and works that influence my thought across various topics.
              The order is randomly shuffled each day.
            </p>
          </div>
        </RevealAnimation>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-6 h-full">
              {column.map((item, itemIndex) => (
                <RevealAnimation key={`${item.type}-${colIndex}-${itemIndex}`} delay={colIndex * 0.05}>
                  {item.type === "image" ? (
                    <Card className="bg-black/70 border-zinc-800 backdrop-blur-md hover:border-purple-500/50 transition-all hover:scale-[1.02] overflow-hidden">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={item.data.src}
                          alt="AI Generated Art"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        />
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-black/70 border-zinc-800 backdrop-blur-md hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-lg group">
                      <CardHeader>
                        <CardTitle className="text-base font-medium group-hover:text-purple-400 transition-colors">
                          {item.data.author || "Anonymous"}
                        </CardTitle>
                        {item.data.category && (
                          <CardDescription className="text-xs">
                            {item.data.category}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm italic text-zinc-300 leading-relaxed">
                          &ldquo;{item.data.text}&rdquo;
                        </p>
                        {item.data.source && (
                          <p className="text-xs text-zinc-500 mt-2 italic">
                            {item.data.source}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </RevealAnimation>
              ))}
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-12">
            <div className="text-zinc-500 text-sm animate-pulse">Loading more quotes...</div>
          </div>
        )}
      </div>
    </div>
  );
}
