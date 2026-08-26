import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Core splits some of its frontend into lazily-loaded chunks — `SettingsPage`,
 * for one. Importing such a module for *value* use resolves to `undefined`
 * while initializers run, and the extension dies on boot with a message as
 * unhelpful as "undefined is not an object".
 *
 * The fix is to pass the module path to `extend()` instead, which defers the
 * patch until the chunk loads. This test reads core's compiled bundles to work
 * out which modules are actually available up front, so the mistake is caught
 * here rather than in the browser.
 */

const here = dirname(fileURLToPath(import.meta.url));
const jsDir = resolve(here, '../..');
const coreDist = resolve(jsDir, '../vendor/flarum/core/js/dist');

/** Every `.ts`/`.tsx` file under `src`. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) return sources(path);

    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

/**
 * The core module paths registered by a bundle — that is, available to an
 * extension the moment its initializer runs.
 */
function registeredIn(bundle: string): Set<string> {
  const source = readFileSync(join(coreDist, bundle), 'utf8');
  const modules = new Set<string>();

  for (const match of source.matchAll(/reg\.add\("core","([^"]+)"/g)) {
    modules.add(match[1]);
  }

  return modules;
}

/**
 * The `flarum/...` modules a file imports for value use. Type-only imports are
 * erased at compile time and so are always safe.
 */
function valueImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const imports: string[] = [];

  for (const match of source.matchAll(/^import\s+(type\s+)?[^;]*?from '(flarum\/[^']+)';/gm)) {
    if (!match[1]) imports.push(match[2].slice('flarum/'.length));
  }

  return imports;
}

const forum = registeredIn('forum.js');
const admin = registeredIn('admin.js');

describe('core imports', () => {
  it('finds core’s compiled bundles', () => {
    // Guards the test itself: an empty set would make every assertion below
    // pass vacuously.
    expect(forum.size).toBeGreaterThan(100);
    expect(admin.size).toBeGreaterThan(100);
  });

  it('knows SettingsPage is lazily loaded', () => {
    // The case that caused the bug. If core ever moves it into the main
    // bundle, this test failing is the signal that the workaround can go.
    expect(forum.has('forum/components/SettingsPage')).toBe(false);
  });

  const files = sources(join(jsDir, 'src'));

  it.each(files.map((file) => [file.slice(jsDir.length + 1), file]))('%s imports only modules that are available at boot', (_name, file) => {
    const frontend = file.includes('/admin/') ? 'admin' : file.includes('/forum/') ? 'forum' : 'both';

    const lazy = valueImports(file).filter((module) => {
      // `flarum/forum/app` and `flarum/admin/app` are the frontend entry
      // points themselves, not registry modules.
      if (module === 'forum/app' || module === 'admin/app') return false;

      if (frontend === 'admin') return !admin.has(module);
      if (frontend === 'forum') return !forum.has(module);

      return !forum.has(module) && !admin.has(module);
    });

    // Naming the offenders in the expectation makes the failure say what to do:
    // import them with `import type` and pass the path to `extend()` instead.
    expect({ lazilyLoadedImports: lazy }).toEqual({ lazilyLoadedImports: [] });
  });
});
