import { NextResponse } from 'next/server';
import path from 'path';
import { readdir } from 'fs/promises';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function fileNameToLabel(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '');
  return stem
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    const entries = await readdir(templatesDir, { withFileTypes: true });
    const templates = entries
      .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map((e) => ({
        src: `/templates/${e.name}`,
        label: fileNameToLabel(e.name),
      }));
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ templates: [] });
  }
}
