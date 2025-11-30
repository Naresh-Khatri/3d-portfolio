"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import timelineData from "@/data/timeline";
import { cn } from "@/lib/utils";
import RevealAnimation from "@/components/reveal-animations";
import ScrollProgress from "@/components/ui/scroll-progress";

type TimelineEvent = {
  start: number;
  end: number;
  event: string;
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
    const yearGroups = document.querySelectorAll('.timeline-year-group');
    let closestGroup: Element | null = null;
    let closestDistance = Infinity;

    yearGroups.forEach((group) => {
      const year = parseInt(group.getAttribute('data-year') || '0');
      const distance = Math.abs(year - targetYear);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestGroup = group;
      }
    });

    if (closestGroup) {
      closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const jumpToRandomYear = () => {
    const yearGroups = document.querySelectorAll('.timeline-year-group');
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
        const rect = timelineRef.current.getBoundingClientRect();
        const isOverTimeline = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom;
        
        if (isOverTimeline) {
          e.preventDefault();
          jumpToRandomYear();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortedYears = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen relative font-sans">
      <ScrollProgress className="bg-gradient-to-r from-violet-500 to-purple-500" />
      
      <div className="container mx-auto px-4 py-24 max-w-7xl">
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
              <div className="timeline-axis relative pr-32">
                {/* Vertical Timeline Line - Fixed on the right, centered */}
                <div className="timeline-line absolute top-0 bottom-0 w-0.5 bg-violet-500/50" style={{ right: '0', transform: 'translateX(50%)' }}></div>

                {/* Timeline Events */}
                <div className="timeline-events space-y-12">
                  {sortedYears.map((year) => {
                    const events = eventsByYear[year];
                    return (
                      <div
                        key={year}
                        className="timeline-year-group relative"
                        data-year={year}
                      >
                        {/* Year Label on Left */}
                        <div className="timeline-year-label absolute left-0 top-0 w-28 text-right">
                          <div className="text-sm font-semibold text-violet-400 sticky top-1/2 -translate-y-1/2">
                            {formatYear(year)}
                          </div>
                        </div>

                        {/* Events Container - Between date and line */}
                        <div className="timeline-events-container ml-32 mr-8 space-y-4">
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

                                {/* Dot Marker - Connected to line on the right, same position as line */}
                                <div 
                                  className={cn(
                                    "timeline-event-marker absolute top-2 z-10 w-3 h-3 rounded-full border-2 border-violet-500",
                                    isSpanning ? "bg-violet-400" : "bg-violet-600"
                                  )} 
                                  style={{ right: '0', transform: 'translateX(50%)' }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
