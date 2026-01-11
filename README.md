# Asher Lau - Engineering Portfolio (Next.js 15)

This is a high-performance, monochrome engineering portfolio built with Next.js 15, Tailwind CSS v4, and Shiki highlighting.

## 🛠 Project Architecture
- **Framework**: Next.js 15 (App Router)
- **Theme**: Stealth Monochrome (Pure Black #000000, Pure White #ffffff, Accent Orange #ff8c42)
- **Content**: Markdown-driven via `content/journal/`
- **Highlighting**: Shiki with `rehype-pretty-code`
- **Fonts**: JetBrains Mono (Headers) and Inter (Body)

---

## 📝 How to Add a New Blog Post
1. **Create File**: Add a new `.md` file in `content/journal/`.
2. **Add Metadata**: Use the following frontmatter at the top:
   ```markdown
   ---
   title: "Your Title"
   date: "YYYY-MM-DD"
   tags: ["tag1", "tag2"]
   description: "Brief summary for the card."
   ---
Write Content: Use standard Markdown. Triple backticks (e.g., ```cpp) trigger Shiki highlighting.

🚀 How to Add a New Project
Create Page: Create a new folder in app/projects/[project-name]/ and add a page.tsx.

Reuse Layout: Copy the metrics grid and section styling from app/projects/jds-cloud/page.tsx.

Register Card: Open app/projects/page.tsx and add a new <Link> card pointing to your route.


🤖 AI Instructions (Give this to your AI)
"I am Asher Lau, a Software Engineer specialized in Distributed Systems and C++23. I am using a Next.js 15 portfolio with a specific monochrome stealth theme.

When helping me:

Strict Theme: Only use Black (#000000), White (#ffffff), and Orange (#ff8c42).

Typography: Use font-mono for headers/technical data and font-sans for prose.

Code Style: Ensure code blocks are optimized for rehype-pretty-code.

Directory Structure:

Root app/ (not src/app/)

content/journal/ for blog markdown

lib/markdown.ts for file system logic

Next.js 15 Rules: Always await params in dynamic routes ([id]/page.tsx)."


---

### How to use this with an AI:
Whenever you want to make a change or add a complex feature, simply send a prompt like this:

> "I want to add a new [Feature/Blog/Project]. Here is my **README.md** for context:
> 
> [Paste the README content here]
> 
> My new content is: [Describe your update here]. Please give me the code."



**Would you like me to help you write your first real technical blog post about C++23 or Distributed Systems using this format?**