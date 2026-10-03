'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export default function GamesNearbyDisclosure({children}:{children:ReactNode}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const reveal=()=>{if(location.hash==='#nearby-games' && ref.current){ref.current.open=true; requestAnimationFrame(()=>ref.current?.scrollIntoView({block:'start'}));}};
    reveal(); window.addEventListener('hashchange',reveal); return()=>window.removeEventListener('hashchange',reveal);
  },[]);
  return <details ref={ref} id="nearby-disclosure" className="scroll-mt-28 rounded-2xl border border-white/15 bg-white/[0.04]">
    <summary className="min-h-12 cursor-pointer rounded-2xl px-4 py-3 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Games Near Me</summary>
    {children}
  </details>;
}
