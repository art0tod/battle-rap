import { mkdir, readFile, rm, writeFile, copyFile, readdir, stat } from 'fs/promises';
import path from 'path';

async function run(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  const distRoot = path.join(projectRoot, 'dist');

  await ensureDir(distRoot);
  await copySqlDirectory(projectRoot, distRoot);
  await copyEnvExample(projectRoot, distRoot);
  await createRuntimePackageJson(projectRoot, distRoot);
  await copyPackageLock(projectRoot, distRoot);
  await removePostbuildArtifacts(distRoot);
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function copySqlDirectory(projectRoot: string, distRoot: string): Promise<void> {
  const source = path.join(projectRoot, 'sql');
  const target = path.join(distRoot, 'sql');
  try {
    await stat(source);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return;
    }
    throw error;
  }
  await rm(target, { recursive: true, force: true });
  await copyDirectory(source, target);
}

async function copyDirectory(source: string, target: string): Promise<void> {
  await mkdir(target, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
        return;
      }
      if (entry.isFile()) {
        await copyFile(sourcePath, targetPath);
      }
    })
  );
}

async function copyEnvExample(projectRoot: string, distRoot: string): Promise<void> {
  const envExamplePath = path.join(projectRoot, '.env.example');
  try {
    await stat(envExamplePath);
  } catch {
    return;
  }
  const target = path.join(distRoot, '.env.example');
  await copyFile(envExamplePath, target);
}

async function createRuntimePackageJson(projectRoot: string, distRoot: string): Promise<void> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const raw = await readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(raw) as {
    name?: string;
    version?: string;
    description?: string;
    dependencies?: Record<string, string>;
    license?: string;
    author?: string;
    engines?: Record<string, string>;
    keywords?: string[];
  };

  const runtimePackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      migrate: 'node scripts/migrate.js'
    },
    dependencies: packageJson.dependencies ?? {},
    license: packageJson.license,
    author: packageJson.author,
    engines: packageJson.engines,
    keywords: packageJson.keywords
  };

  const distPackageJsonPath = path.join(distRoot, 'package.json');
  await writeFile(distPackageJsonPath, JSON.stringify(stripEmpty(runtimePackageJson), null, 2));
}

async function copyPackageLock(projectRoot: string, distRoot: string): Promise<void> {
  const lockPath = path.join(projectRoot, 'package-lock.json');
  try {
    await stat(lockPath);
  } catch {
    return;
  }
  const target = path.join(distRoot, 'package-lock.json');
  await copyFile(lockPath, target);
}

async function removePostbuildArtifacts(distRoot: string): Promise<void> {
  const targets = [
    path.join(distRoot, 'scripts', 'postbuild.js'),
    path.join(distRoot, 'scripts', 'postbuild.js.map'),
    path.join(distRoot, 'scripts', 'postbuild.d.ts')
  ];
  await Promise.all(targets.map(async (target) => rm(target, { force: true })));
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return;
    }
    if (Array.isArray(value) && value.length === 0) {
      return;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = stripEmpty(value as Record<string, unknown>);
      if (Object.keys(nested).length === 0) {
        return;
      }
      result[key] = nested;
      return;
    }
    result[key] = value;
  });
  return result as T;
}

run().catch((error: unknown) => {
  console.error('postbuild failed', error);
  process.exit(1);
});
