"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { articles, shuffleArray, type Article } from "@/data/articles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, ExternalLink } from "lucide-react";
import RevealAnimation from "@/components/reveal-animations";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ArticlesPage() {
  const shuffledArticles = useMemo(() => shuffleArray(articles), []);

  const { displayedItems, hasMore, loadMoreRef } = useInfiniteScroll(
    shuffledArticles,
    {
      initialCount: 18, // 3 rows of 6 items
      loadMoreCount: 18,
    }
  );

  return (
    <div className="min-h-screen relative font-sans">
      <div className="container mx-auto px-4 py-24 min-h-screen">
        <RevealAnimation>
          <Link
            href="/"
            className="inline-flex items-center text-zinc-500 hover:text-purple-400 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </RevealAnimation>

        <RevealAnimation delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Influential Papers
          </h1>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            A curated collection of academic papers and articles that influence my research and thinking across various domains.
          </p>
        </RevealAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((article, index) => (
            <RevealAnimation key={article.id} delay={0}>
              <Card
                className={cn(
                  "h-full border-zinc-800 overflow-hidden",
                  "bg-black/40 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-lg group"
                )}
              >
                {/* Article Preview Image */}
                <div className="h-[200px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-purple-400/50" />
                </div>

                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      {article.category}
                    </Badge>
                    {article.url && (
                      <Link
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-400 transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.authors}
                    {article.venue && article.year && (
                      <span className="ml-2">
                        • {article.venue} {article.year}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                {article.thoughts && (
                  <CardContent>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic line-clamp-3">
                      {article.thoughts}
                    </p>
                  </CardContent>
                )}
              </Card>
            </RevealAnimation>
          ))}
        </div>

        {/* Load more trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            <div className="text-zinc-500 text-sm">Loading more articles...</div>
          </div>
        )}
      </div>
    </div>
  );
}

