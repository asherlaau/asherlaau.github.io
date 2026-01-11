import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const journalDirectory = path.join(process.cwd(), 'content/journal');

export function getJournalEntries() {
  if (!fs.existsSync(journalDirectory)) fs.mkdirSync(journalDirectory, { recursive: true });
  
  const fileNames = fs.readdirSync(journalDirectory);
  return fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(journalDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return { id, content, ...(data as { title: string; date: string; tags: string[] }) };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}