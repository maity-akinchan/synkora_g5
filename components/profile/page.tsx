
"use client";

import React from "react";
import { Camera } from "lucide-react";

export default function Profile() {
  // use the same values you used in settings — read-only here
  const fullName = "Marilyn"; // or "Azunyan U. Wu" etc.
  const email = "elementary221b@gmail.com";
  const phone = "+44 (123) 456-9878";
  const bio =
    "Designer • Coffee lover • Building delightful things. Passionate about UX, product design and team mentoring.";
  const level = 3;
  const levelMultiplier = 6; // shows x6 like screenshot
  const cardsToUnlock = 32;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-6">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden bg-gradient-to-br from-green-400 to-yellow-500 flex items-center justify-center text-white text-lg font-semibold">
            {/* avatar image could go here */}
            M
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{fullName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{email}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            
            <button className="text-sm px-3 py-1 rounded-md bg-green-600 text-white">View Profile</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-start gap-6 border-b border-slate-100 dark:border-slate-700">
            <button className="text-sm font-medium text-slate-600 dark:text-slate-300">My Stats</button>
            <button className="text-sm font-medium text-green-600 border-b-2 border-yellow-600 pb-2">
              Achievements
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Achievement strip (purple card) */}
            <div className="rounded-2xl bg-gradient-to-r from-green-700 to-yellow-500 text-white p-4 md:p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white/12 px-3 py-2 text-center">
                  
                </div>

                <div className="ml-auto text-center md:text-right">
              <div className="text-lg text-white/80">Welcome to my Profile</div>
              </div>
              </div>

             
            </div>

            {/* Profile details area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: small profile summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Profile</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This section contains public profile info and achievements.
                </p>

                <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-yellow-500 flex items-center justify-center text-white font-semibold">
                      M
                    </div>
                    <div>
                      <div className="text-sm font-medium">{fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{email}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <div className="text-xs text-slate-400">Phone</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{phone}</div>
                  </div>
                </div>
              </div>

              {/* Right: achievements + bio */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{bio}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Email</div>
                      <div className="text-sm text-slate-700 dark:text-slate-200">{email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Phone</div>
                      <div className="text-sm text-slate-700 dark:text-slate-200">{phone}</div>
                    </div>
                  </div>
                </div>

                {/* Example: small cards to unlock list (visual placeholders) */}
              
              </div>
            </div>

            {/* Footer small note */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
