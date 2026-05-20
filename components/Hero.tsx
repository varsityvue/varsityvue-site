"use client";

import { motion } from "framer-motion";
import {
  Radio,
  ChevronRight,
  CalendarDays,
  MapPin,
  Trophy,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.4),transparent_40%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7A1022]/50 bg-[#7A1022]/20 px-4 py-2 text-sm">
            <Radio size={16} />
            Built for Friday nights in Texas
          </div>

          <h2 className="text-5xl font-black leading-tight md:text-7xl">
            The game,
            <br />
            seen smarter.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            Searchable school hubs, game coverage, sponsor inventory, and
            scalable high school sports infrastructure built for Texas.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="flex items-center justify-center rounded-full bg-[#7A1022] px-6 py-4 font-semibold hover:bg-[#93142a]">
              Explore Platform <ChevronRight className="ml-2" size={18} />
            </button>

            <button className="rounded-full border border-white/20 px-6 py-4 font-semibold hover:bg-white/10">
              Become Sponsor
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <Stat value="40+" label="Target Schools" />
            <Stat value="10" label="Pilot Hubs" />
            <Stat value="2026" label="Launch Season" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <div className="rounded-3xl bg-black/60 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
              Game Week
            </p>

            <h3 className="mt-2 text-3xl font-black">
              De Leon vs Comanche
            </h3>

            <div className="grid grid-cols-3 items-center py-10 text-center">
              <Team team="DL" name="Bearcats" />
              <div className="text-xl font-bold text-white/30">VS</div>
              <Team team="COM" name="Indians" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Info icon={<CalendarDays size={16} />} text="Friday Night" />
              <Info icon={<MapPin size={16} />} text="Bearcat Stadium" />
              <Info icon={<Trophy size={16} />} text="District Watch" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}

function Team({ team, name }: { team: string; name: string }) {
  return (
    <div>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 font-black">
        {team}
      </div>
      <p className="mt-3 text-sm font-semibold">{name}</p>
    </div>
  );
}

function Info({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm">
      {icon}
      {text}
    </div>
  );
}