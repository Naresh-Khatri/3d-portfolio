import React from "react";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import ScrollProgress from "@/components/ui/scroll-progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RevealAnimation from "@/components/reveal-animations";

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return {
    title: `${post.metadata.title} | Portfolio`,
    description: post.metadata.summary,
  };
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const components = {
  h1: (props: any) => (
    <h1
      className="font-display text-2xl md:text-3xl leading-[1.15] mt-14 mb-6 text-foreground"
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className="font-display text-xl md:text-2xl leading-[1.2] mt-12 mb-4 text-foreground relative"
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3
      className="font-display text-lg md:text-xl leading-[1.25] mt-8 mb-3 text-foreground"
      {...props}
    />
  ),
  p: (props: any) => (
    <p
      className="text-muted-foreground leading-[1.8] mb-7 text-[17px] font-sans"
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul
      className="mb-7 text-muted-foreground space-y-3 text-[17px] leading-[1.8] font-sans"
      {...props}
    />
  ),
  ol: (props: any) => (
    <ol
      className="list-decimal mb-7 text-muted-foreground space-y-3 text-[17px] leading-[1.8] font-sans pl-5"
      {...props}
    />
  ),
  li: (props: any) => (
    <li className="pl-2 relative before:content-['–'] before:absolute before:-left-5 before:text-[hsl(20,100%,70%)] before:font-medium" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote
      className="border-l-2 border-[hsl(20,100%,70%)] pl-6 my-8 text-foreground/80 italic text-lg leading-relaxed font-sans"
      {...props}
    />
  ),
  code: (props: any) => (
    <code
      className="bg-muted/50 text-[hsl(20,100%,65%)] px-1.5 py-0.5 rounded text-[15px] font-mono"
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className="bg-[hsl(222,84%,3%)] p-5 rounded-xl overflow-x-auto mb-8 border border-border/50 text-sm leading-relaxed"
      {...props}
    />
  ),
  a: (props: any) => (
    <a
      className="text-[hsl(20,100%,70%)] hover:text-[hsl(20,100%,80%)] underline decoration-[hsl(20,100%,70%)]/30 underline-offset-4 hover:decoration-[hsl(20,100%,70%)] transition-colors"
      {...props}
    />
  ),
  hr: () => (
    <hr className="my-12 border-none h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  ),
  strong: (props: any) => (
    <strong className="text-foreground font-semibold" {...props} />
  ),
};

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen relative font-sans">
      <ScrollProgress className="bg-gradient-to-r from-[hsl(20,100%,70%)] to-[hsl(30,100%,65%)]" />

      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[hsl(20,100%,70%)]/[0.03] blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 pt-32 pb-24 max-w-[720px]">
        {/* Back link */}
        <RevealAnimation>
          <Link
            href="/blogs"
            className="inline-flex items-center text-muted-foreground hover:text-[hsl(20,100%,70%)] transition-colors mb-12 group text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            All posts
          </Link>
        </RevealAnimation>

        {/* Article header */}
        <RevealAnimation delay={0.1}>
          <header className="mb-12">
            {/* Tags */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {post.metadata.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[hsl(20,100%,70%)]/20 text-[hsl(20,100%,70%)] bg-[hsl(20,100%,70%)]/5 rounded-full px-3 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-4xl leading-[1.1] tracking-tight mb-8">
              {post.metadata.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pb-8 border-b border-border/50">
              {post.metadata.author && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[hsl(20,100%,70%)]/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-[hsl(20,100%,70%)]" />
                  </div>
                  {post.metadata.author}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(post.metadata.publishedAt)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readTime} min read
              </div>
            </div>
          </header>
        </RevealAnimation>

        {/* Article body */}
        <RevealAnimation delay={0.2}>
          <article className="prose prose-invert max-w-none">
            <MDXRemote source={post.content} components={components} />
          </article>
        </RevealAnimation>

        {/* Footer divider */}
        <RevealAnimation delay={0.1}>
          <div className="mt-20 pt-8 border-t border-border/50">
            <Link
              href="/blogs"
              className="inline-flex items-center text-muted-foreground hover:text-[hsl(20,100%,70%)] transition-colors group text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to all posts
            </Link>
          </div>
        </RevealAnimation>
      </div>
    </div>
  );
}
