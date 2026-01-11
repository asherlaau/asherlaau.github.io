import { getPostData } from '@/lib/markdown';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// In Next.js 15, params is a Promise that must be awaited
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // This captures "optimizing-tcp" from the URL
  
  try {
    const post = await getPostData(id);

    return (
      <article className="max-w-3xl mx-auto space-y-8 py-12">
        <Link href="/journal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors font-mono mb-8">
          <ArrowLeft className="size-4" /> Back to Blogs
        </Link>

        <header className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
            <Calendar className="size-4" />
            <time>{post.date}</time>
          </div>
          <h1 className="text-4xl font-mono font-bold text-white leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] uppercase text-muted-foreground font-mono">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <div 
          className="prose prose-invert prose-white max-w-none font-sans text-foreground/90 leading-relaxed
            prose-headings:font-mono prose-headings:text-white
            prose-code:text-accent prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
        />
      </article>
    );
  } catch (error) {
    return (
      <div className="text-center py-20 font-mono">
        <h1 className="text-2xl text-white">Post Not Found</h1>
        <p className="text-muted-foreground mt-2">The requested log entry "{id}" does not exist.</p>
        <Link href="/journal" className="text-accent hover:underline mt-4 inline-block">Return to Blogs</Link>
      </div>
    );
  }
}