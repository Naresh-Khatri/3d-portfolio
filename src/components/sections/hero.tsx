import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { File, Github, Linkedin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePreloader } from "../preloader";
import { BlurIn, BoxReveal } from "../reveal-animations";
import ScrollDownIcon from "../scroll-down-icon";
import { SiGithub, SiLinkedin } from "react-icons/si";
import { config } from "@/data/config";

const HeroSection = () => {
  const { isLoading } = usePreloader();
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matchWidth = () => {
      if (buttonsContainerRef.current && buttonsRowRef.current) {
        buttonsContainerRef.current.style.width = `${buttonsRowRef.current.offsetWidth}px`;
      }
    };

    matchWidth();
    window.addEventListener("resize", matchWidth);
    return () => window.removeEventListener("resize", matchWidth);
  }, [isLoading]);

  return (
    <section id="hero" className={cn("relative w-full h-screen")}>
      <div className="grid md:grid-cols-2">
        <div
          className={cn(
            "h-[calc(100dvh-3rem)] md:h-[calc(100dvh-4rem)] z-[2]",
            "col-span-1",
            "flex flex-col justify-start md:justify-center items-center md:items-start",
            "pt-28 sm:pt-0 sm:pb-16 md:p-20 lg:p-24 xl:p-28"
          )}
        >
          {!isLoading && (
            <>
              <div>
                <BlurIn delay={0.7}>
                  <p
                    className={cn(
                      "md:self-start mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3",
                      "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text "
                    )}
                  >
                    Hi, I am
                    <br className="md:hidden" />
                  </p>
                </BlurIn>
                <BlurIn delay={1}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <h1
                        className={cn(
                          "font-thin text-6xl text-transparent text-slate-800 ml-1 text-left",
                          "cursor-default text-edge-outline font-display sm:text-7xl md:text-9xl "
                        )}
                      >
                        {config.author.split(" ")[0]}
                        <br className="md:block hiidden" />
                        {config.author.split(" ")[1]}
                        {/* PLEASE hello??

                        <br className="md:block hiidden" />
                        UNMUTE ME 😢😢 */}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="dark:bg-white dark:text-black"
                    >
                      theres something waiting for you in devtools
                    </TooltipContent>
                  </Tooltip>
                </BlurIn>
                {/* <div className="md:block hidden bg-gradient-to-r from-zinc-300/0 via-zinc-300/50 to-zinc-300/0 w-screen h-px animate-fade-right animate-glow" /> */}
                {/* <BlurIn delay={1.2}>
                  <p
                    className={cn(
                      "md:self-start md:mt-4 font-thin text-md text-slate-500 dark:text-zinc-400 ml-3",
                      "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text "
                    )}
                  >
                    Aspiring AI Researcher & Software Engineer | B.Tech AI '25 | GRE 327 | Building Intelligent Systems
                  </p>
                </BlurIn> */}
              </div>
              <div className="mt-8 md:ml-2 flex flex-col gap-3">
                <BoxReveal delay={1.4} width="100%">
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-mono mb-2">
                    Building intelligent systems with RL, LLMs, and real-world AI deployments.
                  </p>
                </BoxReveal>
                <BoxReveal delay={1.6} width="100%">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    <span>4+ Research Projects</span>
                    <span>•</span>
                    <span>7 AI/ML Certifications</span>
                  </div>
                </BoxReveal>
                <div ref={buttonsContainerRef} className="md:self-start flex gap-3">
                  <a
                    href={config.cvPath}
                    download
                    className="flex-1"
                  >
                    <BoxReveal delay={2} width="100%" >
                      <Button className="flex items-center gap-2 w-full">
                        <File size={24} />
                        <p>Download CV</p>
                      </Button>
                    </BoxReveal>
                  </a>
                </div>
                <div ref={buttonsRowRef} className="md:self-start flex gap-3">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link href={"#contact"}>
                        <Button
                          variant={"outline"}
                          className="block w-full overflow-hidden"
                        >
                          Contact Me
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Let's connect! 🚀</p>
                    </TooltipContent>
                  </Tooltip>
                  <Link
                    href={config.social.github}
                    target="_blank"
                  >
                    <Button variant={"outline"}>
                      <SiGithub size={24} />
                    </Button>
                  </Link>
                  <Link
                    href={config.social.linkedin}
                    target="_blank"
                  >
                    <Button variant={"outline"}>
                      <SiLinkedin size={24} />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="grid col-span-1"></div>
      </div>
      <div className="absolute bottom-10 left-[50%] translate-x-[-50%]">
        <ScrollDownIcon />
      </div>
    </section>
  );
};

export default HeroSection;
