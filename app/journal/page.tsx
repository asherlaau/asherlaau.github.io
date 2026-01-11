import React from 'react';
import { getJournalEntries } from '@/lib/markdown';
import { BlogSearch } from '@/components/BlogSearch';

export default function DailyPushPage() {
  // 在伺服器端讀取 .md 檔案
  const entries = getJournalEntries();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12">
      <header>
        <div className="text-sm font-mono uppercase text-accent mb-4 tracking-widest">Engineering Journal</div>
        <h1 className="text-5xl font-mono font-bold text-white">Daily Push</h1>
      </header>

      {/* 將抓到的文章資料傳給客戶端搜尋組件 */}
      <BlogSearch entries={entries} />
    </div>
  );
}