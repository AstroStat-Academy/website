"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function SparklesPreview() {
  return (
    <div className="h-[40rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
      <div className="w-full max-w-[80rem] mx-auto flex flex-col items-center">
        <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center text-white relative z-20">
          AstroStat Academy
        </h1>

        <div className="w-full h-40 relative">
        <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 w-[50rem] h-[5px] bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 w-[50rem] h-[1px] bg-gradient-to-r from-transparent via-sky-500 to-transparent left-1/2 -translate-x-1/2" />

          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1000}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />

          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(800px_250px_at_top,transparent_20%,black_50%)]" />
        </div>
      </div>
    </div>
  );
}

