"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const navItems = [
    { id: '/', label: 'Home' },
    { id: '/projects', label: 'Projects' },
    { id: '/journal', label: 'Blogs' },
  ];

  return (
    <nav className="border-b border-border bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono text-xl font-bold text-white hover:opacity-80 transition-all">
          Asher
        </Link>
        <div className="flex gap-8 font-mono">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.id}
              className={`relative text-sm transition-colors ${
                pathname.startsWith(item.id === '/' ? 'none' : item.id) || pathname === item.id 
                  ? 'text-white font-bold' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              {item.label}
              {(pathname === item.id || (item.id !== '/' && pathname.startsWith(item.id))) && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-accent" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}