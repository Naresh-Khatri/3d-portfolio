"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BoxReveal } from "../reveal-animations";
import { articles, quotes, shuffleArray, getArticleImage, type Article, type Quote } from "@/data/articles";
import { ExternalLink, BookOpen, MessageSquareQuote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className="h-[200px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <BookOpen className="w-16 h-16 text-purple-400/50" />
      </div>
    );
  }
  
  return (
    <div className="relative h-[200px] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}

const ArticlesSection = () => {
  // Shuffle articles and quotes deterministically (same order for same day on server and client)
  // Using date as seed ensures consistent ordering across server and client renders
  const shuffledArticles = useMemo(() => shuffleArray(articles), []);
  const shuffledQuotes = useMemo(() => shuffleArray(quotes), []);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  return (
    <section id="articles" className="max-w-7xl mx-auto min-h-screen py-20">
      <Link href={"#articles"}>
        <h2
          className={cn(
            "bg-clip-text text-4xl text-center text-transparent md:text-7xl pt-16 mb-16",
            "bg-gradient-to-b from-black/80 to-black/50",
            "dark:bg-gradient-to-b dark:from-white/80 dark:to-white/20 dark:bg-opacity-50"
          )}
        >
          Articles & Quotes
        </h2>
      </Link>

      <p className="text-center text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
        A curated collection of academic papers and quotes that influence my research and thinking across various domains. Click on a card for some thoughts.
      </p>
      
      <div className="flex justify-center gap-4 mb-12">
        <Button 
          variant="outline" 
          className="group hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all duration-300 rounded-md"
          asChild
        >
          <Link href="/quotes" className="no-underline flex items-center">
            View All Quotes
            <MessageSquareQuote className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
          </Link>
        </Button>
        <Button 
          variant="outline" 
          className="group hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all duration-300 rounded-md"
          asChild
        >
          <Link href="/articles" className="no-underline flex items-center">
            View All Articles
            <BookOpen className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
          </Link>
        </Button>
      </div>

      {/* Quotes Section */}
      <div className="mb-20">
        <BoxReveal width="100%">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquareQuote className="w-6 h-6 text-purple-500" />
            <h3 className="text-2xl md:text-3xl font-semibold">Quotes</h3>
          </div>
        </BoxReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {shuffledQuotes.slice(0, 2).map((quote, index) => (
            <BoxReveal key={quote.id} delay={index * 0.1}>
              <div className="rounded-lg overflow-hidden">
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                    "bg-white/70 dark:bg-black/70 backdrop-blur-sm"
                  )}
                  onClick={() =>
                    setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)
                  }
                >
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
                  <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  {selectedQuote?.id === quote.id && quote.source && (
                    <p className="text-xs text-zinc-500 mt-2">{quote.source}</p>
                  )}
                </CardContent>
                </Card>
              </div>
            </BoxReveal>
          ))}
        </div>
        
        <BoxReveal width="100%">
          <div className="flex justify-center items-center mt-8 w-full">
            <Link href="/quotes" className="no-underline">
              <Button 
                variant="outline" 
                className="group hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all duration-300 rounded-md flex items-center"
              >
                View All Quotes
                <MessageSquareQuote className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </BoxReveal>
      </div>

      {/* Articles Section */}
      <div>
        <BoxReveal width="100%">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-purple-500" />
            <h3 className="text-2xl md:text-3xl font-semibold">Influential Papers</h3>
          </div>
        </BoxReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {shuffledArticles.slice(0, 2).map((article, index) => {
            const imageUrl = article.imageUrl || getArticleImage(article.id);
            
            return (
            <BoxReveal key={article.id} delay={index * 0.1}>
              <div className="rounded-lg overflow-hidden">
                <Card
                  className={cn(
                    "transition-all hover:scale-[1.02] hover:shadow-lg",
                    "bg-white/70 dark:bg-black/70 backdrop-blur-sm"
                  )}
                >
                {/* Article Preview Image from Better Images of AI */}
                <ArticleImage src={imageUrl} alt={article.title} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-semibold flex-1">
                      {article.title}
                    </CardTitle>
                    {article.url && (
                      <Link
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
                  <CardDescription>
                    {article.authors}
                    {article.venue && article.year && (
                      <span className="ml-2">
                        • {article.venue} {article.year}
                      </span>
                    )}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full">
                      {article.category}
                    </span>
                  </div>
                </CardHeader>
                {article.thoughts && (
                  <CardContent>
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                        {article.thoughts}
                      </p>
                    </div>
                  </CardContent>
                )}
                </Card>
              </div>
            </BoxReveal>
            );
          })}
        </div>
        
        <BoxReveal width="100%">
          <div className="flex justify-center items-center mt-8 w-full">
            <Link href="/articles" className="no-underline">
              <Button 
                variant="outline" 
                className="group hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all duration-300 rounded-md flex items-center"
              >
                View All Articles
                <BookOpen className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </BoxReveal>
      </div>
    </section>
  );
};

export default ArticlesSection;

