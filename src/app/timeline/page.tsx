"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import timelineData from "@/data/timeline";
import { BETTER_AI_IMAGES } from "@/data/articles";
import RevealAnimation from "@/components/reveal-animations";

type TimelineEvent = {
  start: number;
  end: number;
  event: string;
  image?: string;
};

export default function TimelinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(() => {
    return timelineData.filter((event: TimelineEvent) => {
      const matchesSearch = event.event.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = yearFilter === null || 
        (event.start <= yearFilter && event.end >= yearFilter) ||
        (event.start === yearFilter || event.end === yearFilter);
      return matchesSearch && matchesYear;
    });
  }, [searchTerm, yearFilter]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    filteredEvents.forEach((event: TimelineEvent) => {
      const year = event.start;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const formatYear = (year: number) => {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    } else if (year === 0) {
      return '1 BCE';
    } else {
      return `${year} CE`;
    }
  };

  // Navigation periods
  const navPeriods = [
    { year: -2000, label: '2000 BCE' },
    { year: -1000, label: '1000 BCE' },
    { year: 0, label: '0 CE' },
    { year: 500, label: '500 CE' },
    { year: 1000, label: '1000 CE' },
    { year: 1500, label: '1500 CE' },
    { year: 1700, label: '1700 CE' },
    { year: 1800, label: '1800 CE' },
    { year: 1900, label: '1900 CE' },
    { year: 1950, label: '1950 CE' },
    { year: 2000, label: '2000 CE' }
  ];

  const scrollToClosestYear = (targetYear: number) => {
    const yearGroups = Array.from(document.querySelectorAll('.timeline-year-group')) as HTMLElement[];
    let closestGroup: HTMLElement | null = null;
    let closestDistance = Infinity;

    for (const group of yearGroups) {
      const year = parseInt(group.getAttribute('data-year') || '0');
      const distance = Math.abs(year - targetYear);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestGroup = group;
      }
    }

    if (closestGroup) {
      closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const jumpToRandomYear = () => {
    const yearGroups = Array.from(document.querySelectorAll('.timeline-year-group')) as HTMLElement[];
    if (yearGroups.length > 0) {
      const randomIndex = Math.floor(Math.random() * yearGroups.length);
      const randomGroup = yearGroups[randomIndex];
      randomGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle spacebar for random year
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && timelineRef.current) {
        e.preventDefault();
        jumpToRandomYear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortedYears = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // Shuffle images once and track usage to avoid repeats
  const shuffledImages = useMemo(() => {
    const shuffled = [...BETTER_AI_IMAGES];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Track which images to show and their order
  const imageAssignments = useMemo(() => {
    const assignments: (string | null)[] = [];
    let imageIndex = 0;

    sortedYears.forEach((year, yearIndex) => {
      // Show images between year groups (every 2-3 year groups)
      if (yearIndex % 3 === 0 || Math.abs(year) % 500 === 0) {
        if (yearIndex < sortedYears.length - 1 && imageIndex < shuffledImages.length) {
          assignments[yearIndex] = shuffledImages[imageIndex];
          imageIndex++;
        } else {
          assignments[yearIndex] = null;
        }
      } else {
        assignments[yearIndex] = null;
      }
    });

    return assignments;
  }, [sortedYears, shuffledImages]);

  return (
    <div className="min-h-screen relative font-sans">
      <div className="container mx-auto px-4 py-24 max-w-7xl">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <RevealAnimation>
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
            History Timeline
          </h1>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Explore significant events throughout history
          </p>
        </RevealAnimation>

        <RevealAnimation delay={0.1}>
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="number"
              placeholder="Filter by year..."
              value={yearFilter || ""}
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 w-full md:w-48"
            />
          </div>
        </RevealAnimation>

        {/* Navigation Panel */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:block">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
            <div className="text-sm font-semibold text-violet-400 mb-3">Navigate Timeline</div>
            <div className="space-y-2">
              {navPeriods.map((period) => (
                <div
                  key={period.year}
                  onClick={() => scrollToClosestYear(period.year)}
                  className="text-xs text-zinc-400 hover:text-violet-400 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                >
                  {period.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Random Button */}
        <button
          onClick={jumpToRandomYear}
          className="md:hidden fixed bottom-6 right-6 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-colors"
        >
          Random Year
        </button>

        <RevealAnimation delay={0.2}>
          <div ref={timelineRef} id="timeline-container" className="history-timeline relative max-w-5xl mx-auto">
            {sortedYears.length > 0 ? (
              <div className="timeline-axis relative">
                {/* Vertical Line near Date */}
                <div className="timeline-date-line absolute top-0 bottom-0 w-0.5 bg-violet-500/30 left-28"></div>

                {/* Timeline Events */}
                <div className="timeline-events space-y-12">
                  {sortedYears.map((year, yearIndex) => {
                    const events = eventsByYear[year];
                    const yearImage = imageAssignments[yearIndex] || null;
                    return (
                      <React.Fragment key={year}>
                        <div
                          className="timeline-year-group relative"
                          data-year={year}
                        >
                          {/* Year Label on Left */}
                          <div className="timeline-year-label absolute left-0 top-0 w-28 text-right pr-4">
                            <div className="text-sm font-semibold text-violet-400 sticky top-1/2 -translate-y-1/2">
                              {formatYear(year)}
                            </div>
                          </div>

                          {/* Events Container */}
                          <div className="timeline-events-container ml-32 space-y-4">
                            {events.map((event, index) => {
                              const isSpanning = event.start !== event.end;
                              return (
                                <div
                                  key={index}
                                  className="timeline-event relative flex items-start"
                                  data-year={year}
                                  data-index={index}
                                >
                                  {/* Event Content */}
                                  <div className="timeline-event-content w-full">
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                                      <p className="text-white text-sm">
                                        {isSpanning
                                          ? `${event.event} (${formatYear(event.start)} - ${formatYear(event.end)})`
                                          : event.event}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Image between year groups */}
                        {yearImage && yearIndex < sortedYears.length - 1 && (
                          <div className="timeline-image-container my-8 ml-32">
                            <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-zinc-800">
                              <Image
                                src={yearImage}
                                alt={`Historical period around ${formatYear(year)}`}
                                width={400}
                                height={250}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>No events found matching your search.</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-sm text-zinc-500 text-center">
            Showing {filteredEvents.length} of {timelineData.length} events
          </div>
        </RevealAnimation>
      </div>
    </div>
  );
}
