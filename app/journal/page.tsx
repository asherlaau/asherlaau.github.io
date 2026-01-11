"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Tag, ArrowRight } from 'lucide-react';

export default function DailyPushPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // These IDs must match your .md filenames in content/journal/
  const entries = [
    {
      id: 'optimizing-tcp',
      date: '2026-01-09',
      title: 'Optimizing TCP Buffer Management',
      description: 'Reduced memory allocations by 40% using custom allocator pools. Implemented ring buffers for zero-copy packet processing.',
      tags: ['networking', 'performance', 'tcp/ip']
    },
    // ... add other entries here
  ];

  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    return entry.title.toLowerCase().includes(query) || 
           entry.tags.some(tag => tag.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <div className="text-sm font-mono uppercase text-accent mb-4 tracking-widest">Engineering Journal</div>
        <h1 className="text-5xl font-mono font-bold text-white">Daily Push</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search topics or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20 text-white font-mono text-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Link key={entry.id} href={`/journal/${entry.id}`} className="block group">
            <article className="bg-card border border-border rounded-lg p-6 hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Calendar className="size-3.5" />
                  <time>{entry.date}</time>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-mono font-semibold mb-3 group-hover:text-white transition-colors">{entry.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-sm group-hover:text-foreground/90 transition-colors">{entry.description}</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] uppercase text-muted-foreground font-mono group-hover:border-white/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}