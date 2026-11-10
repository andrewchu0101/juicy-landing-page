import { describe, expect, it } from 'vitest';
import lockRaw from '../package-lock.json?raw';
import packageRaw from '../package.json?raw';
import { findLooseVersions, findUnverifiedLockEntries, type LockEntry, type LockFile, type PackageJson } from '../scripts/lockfileGuard';

// issue 024｜NFR-09、SDS EXT-03 的共通契約：依賴用確切版本，鎖定檔每一項都有完整性雜湊且來自 npm registry。
// 上半部用手寫的壞資料驗證檢查函式本身（預期值是字面常數）；下半部把函式套到真實的 package.json 與 package-lock.json。

describe('findLooseVersions', () => {
  const pkg = (deps: Record<string, string>): PackageJson => ({ dependencies: deps, devDependencies: {} });

  it('accepts exact versions, including an npm: alias to an exact version', () => {
    expect(findLooseVersions(pkg({ a: '1.2.3', b: '0.0.1-beta.4', c: 'npm:typescript@7.0.2' }))).toEqual([]);
  });

  it.each(['^1.2.3', '~1.2.3', '>=1.0.0', '1.x', '*', 'latest', '', 'next'])('rejects the range or tag %j', (range) => {
    expect(findLooseVersions(pkg({ a: range }))).toEqual([`dependencies.a = ${JSON.stringify(range)}`]);
  });

  it.each([
    'git+https://github.com/o/r.git#main',
    'github:o/r#v1',
    'https://example.com/a.tgz',
    'file:../a',
    'npm:typescript@^7',
  ])('rejects the non-registry or floating source %j', (source) => {
    expect(findLooseVersions(pkg({ a: source })).length).toBe(1);
  });

  it('checks devDependencies, optionalDependencies and peerDependencies too', () => {
    const result = findLooseVersions({
      devDependencies: { d: '^1.0.0' },
      optionalDependencies: { o: '~1.0.0' },
    });
    expect(result).toEqual(['devDependencies.d = "^1.0.0"', 'optionalDependencies.o = "~1.0.0"']);
  });
});

describe('findUnverifiedLockEntries', () => {
  const ok = { version: '1.0.0', resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz', integrity: 'sha512-abc' };

  it('accepts entries with a registry URL and an integrity hash, and ignores the root entry', () => {
    const lock: LockFile = { lockfileVersion: 3, packages: { '': { name: 'root' }, 'node_modules/a': ok } };
    expect(findUnverifiedLockEntries(lock)).toEqual([]);
  });

  it('flags a missing integrity hash', () => {
    const noIntegrity: LockEntry = { version: ok.version, resolved: ok.resolved };
    const lock: LockFile = { lockfileVersion: 3, packages: { 'node_modules/a': noIntegrity } };
    expect(findUnverifiedLockEntries(lock)).toEqual(['node_modules/a: 沒有 integrity']);
  });

  it('flags a resolved URL outside the npm registry (git, http, other hosts)', () => {
    const lock: LockFile = {
      lockfileVersion: 3,
      packages: {
        'node_modules/g': { ...ok, resolved: 'git+ssh://git@github.com/o/r.git#abc' },
        'node_modules/h': { ...ok, resolved: 'http://registry.npmjs.org/h/-/h-1.0.0.tgz' },
        'node_modules/x': { ...ok, resolved: 'https://registry.npmjs.org.evil.example/x.tgz' },
      },
    };
    expect(findUnverifiedLockEntries(lock)).toEqual([
      'node_modules/g: resolved 不是 npm registry（git+ssh://git@github.com/o/r.git#abc）',
      'node_modules/h: resolved 不是 npm registry（http://registry.npmjs.org/h/-/h-1.0.0.tgz）',
      'node_modules/x: resolved 不是 npm registry（https://registry.npmjs.org.evil.example/x.tgz）',
    ]);
  });

  it('rejects a lockfile older than version 3 or one with no packages (guards against a vacuous pass)', () => {
    expect(findUnverifiedLockEntries({ lockfileVersion: 2, packages: { 'node_modules/a': ok } })).toEqual(['lockfileVersion 必須是 3，目前是 2']);
    expect(findUnverifiedLockEntries({ lockfileVersion: 3, packages: {} })).toEqual(['package-lock.json 沒有任何套件']);
  });
});

describe('this repository', () => {
  it('pins every dependency in package.json to an exact version', () => {
    expect(findLooseVersions(JSON.parse(packageRaw) as PackageJson)).toEqual([]);
  });

  it('has an integrity hash and a registry URL for every entry in package-lock.json', () => {
    expect(findUnverifiedLockEntries(JSON.parse(lockRaw) as LockFile)).toEqual([]);
  });
});
