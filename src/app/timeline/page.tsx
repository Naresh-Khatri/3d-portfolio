"use client";

import React, { useRef, useState, useEffect } from "react";
import timelineData from "@/data/timeline";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
  start: number;
  end: number;
  event: string;
}

// Format year with BCE/CE
function formatYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  } else if (year === 0) {
    return "0 CE";
  } else {
    return `${year} CE`;
  }
}

// Group events by year (using start year)
function groupEventsByYear(events: TimelineEvent[]): Map<number, TimelineEvent[]> {
  const grouped = new Map<number, TimelineEvent[]>();

  events.forEach(event => {
    const year = event.start;
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(event);
  });

  return grouped;
}

// Get navigation years (every 500 years for BCE, every 100 years for CE)
function getNavigationYears(events: TimelineEvent[]): number[] {
  const years = new Set<number>();

  // Add some key navigation points
  years.add(-2000);
  years.add(-1000);
  years.add(0);
  years.add(500);
  years.add(1000);
  years.add(1500);
  years.add(1700);
  years.add(1800);
  years.add(1900);
  years.add(1950);
  years.add(2000);

  return Array.from(years).sort((a, b) => a - b);
}

export default function TimelinePage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const groupedEvents = groupEventsByYear(timelineData as TimelineEvent[]);
  const sortedYears = Array.from(groupedEvents.keys()).sort((a, b) => a - b);
  const navigationYears = getNavigationYears(timelineData as TimelineEvent[]);

  // Scroll to a specific year
  const scrollToYear = (year: number) => {
    const yearElement = document.getElementById(`year-${year}`);
    if (yearElement) {
      yearElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentYear(year);
    }
  };

  // Track current year on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const centerY = window.innerHeight / 2;

      // Find the year closest to the center
      let closestYear = sortedYears[0];
      let minDistance = Infinity;

      sortedYears.forEach(year => {
        const element = document.getElementById(`year-${year}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - centerY);
          if (distance < minDistance) {
            minDistance = distance;
            closestYear = year;
          }
        }
      });

      setCurrentYear(closestYear);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sortedYears]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-300 pt-20 pb-20">
      <div className="container mx-auto px-4 md:px-[50px] xl:px-[200px]">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Historical Timeline</h1>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
              >
                Navigate Timeline
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-60 bg-zinc-900 border-zinc-700 text-zinc-300 max-h-[500px] overflow-y-auto"
              align="end"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-4 text-[hsl(270,100%,70%)]">Navigate Timeline</h3>
                {navigationYears.map(year => (
                  <button
                    key={year}
                    onClick={() => scrollToYear(year)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-zinc-800 transition-colors"
                  >
                    {formatYear(year)}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Vertical Line - Positioned in center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[hsl(270,100%,70%)] transform -translate-x-1/2" />

          {/* Timeline Events */}
          <div className="space-y-12">
            {sortedYears.map((year, index) => {
              const events = groupedEvents.get(year)!;
              const isLeftAligned = index % 2 === 0;

              return (
                <div
                  key={year}
                  id={`year-${year}`}
                  className="relative"
                >
                  {/* Timeline Dot - Centered on the line */}
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1">
                    <div className="w-4 h-4 rounded-full bg-[hsl(270,100%,70%)] ring-4 ring-zinc-900" />
                  </div>

                  {/* Content Container */}
                  <div className={`grid grid-cols-[1fr_auto_1fr] gap-8 items-start`}>
                    {/* Left Side - Year or Event */}
                    <div className={`${isLeftAligned ? 'text-right' : ''} ${!isLeftAligned ? 'invisible' : ''}`}>
                      {isLeftAligned && (
                        <div className="inline-block">
                          <div className="text-2xl font-bold text-[hsl(270,100%,70%)]">
                            {formatYear(year)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center - Spacer for the line/dot */}
                    <div className="w-4" />

                    {/* Right Side - Event or Year */}
                    <div className={`${!isLeftAligned ? 'text-left' : ''} ${isLeftAligned ? 'invisible' : ''}`}>
                      {!isLeftAligned && (
                        <div className="inline-block">
                          <div className="text-2xl font-bold text-[hsl(270,100%,70%)]">
                            {formatYear(year)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-8 mt-4">
                    {/* Left Side */}
                    <div className={`${isLeftAligned ? '' : 'invisible'}`}>
                      {isLeftAligned && (
                        <div className="text-right space-y-3">
                          {events.map((event, i) => (
                            <div
                              key={i}
                              className="p-4 bg-zinc-800/50 border-[.5px] border-zinc-600 rounded-lg backdrop-blur-sm"
                            >
                              <p className="text-sm text-zinc-300">{event.event}</p>
                              {event.start !== event.end && (
                                <p className="text-xs text-zinc-500 mt-2">
                                  {formatYear(event.start)} - {formatYear(event.end)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Center - Spacer */}
                    <div className="w-4" />

                    {/* Right Side */}
                    <div className={`${!isLeftAligned ? '' : 'invisible'}`}>
                      {!isLeftAligned && (
                        <div className="text-left space-y-3">
                          {events.map((event, i) => (
                            <div
                              key={i}
                              className="p-4 bg-zinc-800/50 border-[.5px] border-zinc-600 rounded-lg backdrop-blur-sm"
                            >
                              <p className="text-sm text-zinc-300">{event.event}</p>
                              {event.start !== event.end && (
                                <p className="text-xs text-zinc-500 mt-2">
                                  {formatYear(event.start)} - {formatYear(event.end)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
