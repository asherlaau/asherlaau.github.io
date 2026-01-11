"use client"; // 這是一個客戶端組件

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, ArrowRight } from 'lucide-react';

interface BlogEntry {
  id: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

export function BlogSearch({ entries }: { entries: BlogEntry[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // 搜尋過濾邏輯
// components/BlogSearch.tsx (第 22 行附近)

const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    
    // 使用可選鏈與預設空字串，確保 toLowerCase() 永遠有對象可以執行
    const title = entry.title?.toLowerCase() ?? "";
    const description = entry.description?.toLowerCase() ?? "";
    const tags = entry.tags ?? [];

    return (
      title.includes(query) ||
      description.includes(query) ||
      tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8">
      {/* 搜尋框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜尋標題、內容或標籤 (例如: C++23, 分佈式)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20 text-white font-mono text-sm"
        />
      </div>

      {/* 列表顯示 */}
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
              <h2 className="text-xl font-mono font-semibold mb-3 group-hover:text-white transition-colors">
                {entry.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
                {entry.description}
              </p>
                {/* 修改 components/BlogSearch.tsx 第 69 行 */}

                <div className="flex flex-wrap gap-2">
                {/* 使用 (entry.tags ?? []) 確保即便 tags 是 undefined 也能運行 */}
                {(entry.tags ?? []).map((tag: string) => (
                    <span 
                    key={tag} 
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] uppercase text-muted-foreground font-mono"
                    >
                    #{tag}
                    </span>
                ))}
                </div>
            </article>
          </Link>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-20 text-muted-foreground font-mono">
            未找到與 "{searchQuery}" 相關的文章
          </div>
        )}
      </div>
    </div>
  );
}