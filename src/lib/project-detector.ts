import path from 'path';
import { promises as fs } from 'fs';

export async function findProjectRoot(startDir: string): Promise<string> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // Check for package.json
    const packageJsonPath = path.join(currentDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
      return currentDir;
    } catch {
      // Not found, continue
    }

    // Check for .git directory
    const gitPath = path.join(currentDir, '.git');
    try {
      const stats = await fs.stat(gitPath);
      if (stats.isDirectory()) {
        return currentDir;
      }
    } catch {
      // Not found, continue
    }

    // Check for mcp.config.js
    const mcpConfigPath = path.join(currentDir, 'mcp.config.js');
    try {
      await fs.access(mcpConfigPath);
      return currentDir;
    } catch {
      // Not found, continue
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }

  // If we couldn't find a project root, return the starting directory
  return startDir;
}

export async function detectFramework(projectRoot: string): Promise<string | null> {
  try {
    // Read package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Detect framework by dependencies
    if (dependencies['react'] || dependencies['react-dom']) {
      return 'react';
    }

    if (dependencies['vue'] || dependencies['@vue/cli-service']) {
      return 'vue';
    }

    if (dependencies['@angular/core']) {
      return 'angular';
    }

    if (dependencies['svelte']) {
      return 'svelte';
    }

    // Check for Next.js (React framework)
    if (dependencies['next']) {
      return 'react';
    }

    // Check for Nuxt (Vue framework)
    if (dependencies['nuxt']) {
      return 'vue';
    }

    // Check by file patterns
    const srcDir = path.join(projectRoot, 'src');
    try {
      const files = await fs.readdir(srcDir);

      const hasTsx = files.some(f => f.endsWith('.tsx'));
      const hasVue = files.some(f => f.endsWith('.vue'));
      const hasSvelte = files.some(f => f.endsWith('.svelte'));

      if (hasTsx) return 'react';
      if (hasVue) return 'vue';
      if (hasSvelte) return 'svelte';
    } catch {
      // src directory doesn't exist or not accessible
    }

    return null;
  } catch {
    return null;
  }
}

export async function getSourceDirectory(projectRoot: string): Promise<string> {
  // Try common source directory names
  const possibleDirs = ['src', 'lib', 'app', 'source', 'client'];

  for (const dir of possibleDirs) {
    const dirPath = path.join(projectRoot, dir);
    try {
      const stats = await fs.stat(dirPath);
      if (stats.isDirectory()) {
        return dir;
      }
    } catch {
      // Directory doesn't exist, try next
    }
  }

  // Default to 'src'
  return 'src';
}

export async function getFileExtensions(framework: string | null): Promise<string[]> {
  const baseExtensions = ['ts', 'js'];

  switch (framework) {
    case 'react':
      return [...baseExtensions, 'tsx', 'jsx'];
    case 'vue':
      return [...baseExtensions, 'vue'];
    case 'angular':
      return [...baseExtensions];
    case 'svelte':
      return [...baseExtensions, 'svelte'];
    default:
      return [...baseExtensions, 'tsx', 'jsx']; // Default to React-like
  }
}

export function getGlobPatterns(sourceDir: string, extensions: string[]): string[] {
  return extensions.map(ext => `${sourceDir}/**/*.${ext}`);
}

export function getExcludePatterns(): string[] {
  return [
    'node_modules',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    'coverage',
    '.cache',
    'public',
    'static',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/__tests__/**',
    '**/__mocks__/**'
  ];
}
