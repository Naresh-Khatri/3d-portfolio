import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

const metadataSchema = z.object({
  title: z.string().trim().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    (value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    },
    "Expected a valid date in YYYY-MM-DD format",
  ),
  summary: z.string().trim().min(1),
  image: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

function getBlogsDirectory() {
  return path.join(process.cwd(), "src/content/blogs");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);
  const result = metadataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid blog frontmatter in ${filePath}: ${result.error.message}`);
  }
  return { metadata: result.data, content };
}

export function getBlogPosts() {
  const dir = getBlogsDirectory();
  return fs.readdirSync(dir)
    .filter((file) => path.extname(file) === ".mdx")
    .map((file) => ({
      ...readMDXFile(path.join(dir, file)),
      slug: path.basename(file, ".mdx"),
    }));
}

export function getBlogPost(slug: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) return null;
  const filePath = path.join(getBlogsDirectory(), `${slug}.mdx`);
  try {
    return readMDXFile(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
