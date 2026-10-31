import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

function getAllTypeScriptFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTypeScriptFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Core Architecture Boundary', () => {
  it('ensures src/core/ does not import electron or OS-specific platform adapters', () => {
    const coreDir = path.resolve(__dirname, '../../src/core');
    const files = getAllTypeScriptFiles(coreDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/from\s+['"]electron['"]/);
      expect(content).not.toMatch(/require\(\s*['"]electron['"]\s*\)/);
      expect(content).not.toMatch(/from\s+['"].*\/platform\//);
    }
  });
});
