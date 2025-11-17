"use client";

import Link from "next/link";
import Image from "next/image";
import InfiniteMenu from "./InfiniteMenu";
import Waves from "./Waves";
import BlurText from "./BlurText";
import ScrollFloat from "./ScrollFloat";
import ShinyText from "./ShinyText";
import TrueFocus from "./TrueFocus";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const teamMembers = [
  {
    image: "/images/team/jacob-jones.jpg",
    link: "/about/team/jacob-jones",
    title: "Jacob Jones",
    description: "CEO - Leading Synkora's vision for AI-powered collaboration",
  },
  {
    image: "/images/team/kristin-watson.jpg",
    link: "/about/team/kristin-watson",
    title: "Kristin Watson",
    description: "Marketing - Driving growth and connecting teams worldwide",
  },
  {
    image: "/images/team/darlene-robertson.jpg",
    link: "/about/team/darlene-robertson",
    title: "Darlene Robertson",
    description: "Engineer - Building the future of collaborative workspaces",
  },
  {
    image: "/images/team/cameron-williamson.jpg",
    link: "/about/team/cameron-williamson",
    title: "Cameron Williamson",
    description: "Designer - Crafting intuitive experiences for modern teams",
  },
];

export default function AboutContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === undefined;

  return (
    <>
      {/* HERO SECTION */}
      <section
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
          isDark ? "bg-black" : "bg-white"
        }`}
      >
        <div className="absolute inset-0">
          <Waves
            lineColor={isDark ? "#fff" : "#000"}
            backgroundColor={
              isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
            }
            waveSpeedX={0.02}
            waveSpeedY={0.01}
            waveAmpX={40}
            waveAmpY={20}
            friction={0.9}
            tension={0.01}
            maxCursorMove={120}
            xGap={12}
            yGap={36}
          />
        </div>

        <div className="relative z-10 text-center px-8 pt-32 pb-20">
          <TrueFocus
            sentence="About Us"
            manualMode={false}
            blurAmount={5}
            borderColor="#84cc16"
            glowColor="rgba(132,204,22,0.6)"
            animationDuration={2}
            pauseBetweenAnimations={1}
          />
          <nav
            className={`mt-4 text-sm md:text-base ${
              isDark ? "text-white/80" : "text-black/80"
            }`}
          >
            <span>Home</span> / <span>About Us</span>
          </nav>
        </div>
      </section>

      {/* MAIN CONTENT SECTION */}
      <motion.section
        className="relative bg-black py-20 px-8"
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* IMAGE */}
          <div>
            <div className="rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] duration-500">
              <Image
                src="/images/team/synkora-team.jpg"
                alt="Synkora Team"
                width={800}
                height={600}
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* TEXT */}
          <div className="space-y-6 text-left font-serif">
            <ScrollFloat
              textClassName="text-5xl font-bold text-white"
              stagger={0.05}
              animationDuration={1}
            >
              We Always Make Best
            </ScrollFloat>

            <p className="text-white/70 text-lg leading-relaxed">
              Synkora is your team’s visual command center powered by AI.
            </p>

            <p className="text-white/60 text-base leading-relaxed italic">
              Juggling tools slows progress—Synkora unifies everything into one
              intelligent workspace.
            </p>

            <Link
              href="/contact"
              className="neon-btn inline-block mt-6 px-10 py-4 rounded-full bg-[#B8FF14] text-black text-lg font-semibold tracking-wide"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </motion.section>

      {/* TEAM SECTION */}
      <section
        className={`relative py-20 px-8 ${
          isDark ? "bg-black" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <ShinyText
              text="Team Synkora"
              speed={1.9}
              className="text-4xl md:text-5xl font-bold"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(197,224,156,0.61) 40%, rgba(150,241,53,1) 50%, rgba(128,233,107,0.77) 60%)",
              }}
            />

            <p
              className={`mt-4 text-lg max-w-2xl mx-auto ${
                isDark ? "text-white/60" : "text-black/60"
              }`}
            >
              Meet the talented individuals driving innovation at
              <span className="italic text-[#84cc16]"> Synkora</span>.
            </p>
          </div>

          <div className="relative h-screen w-full">
            <InfiniteMenu items={teamMembers} />
          </div>
        </div>
      </section>
    </>
  );
}
