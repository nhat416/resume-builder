import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Returns the app version. Priority:
// 1) process.env.APP_VERSION (set during Docker build in CI)
// 2) computed version: <package.json version>+build.<git-commit-count> (when git is available)
// 3) package.json version
// 4) fallback '0.0.0'
export async function GET() {
  try {
    // 1) env override
    if (process.env.APP_VERSION && process.env.APP_VERSION.trim() !== '') {
      return NextResponse.json({ version: process.env.APP_VERSION })
    }

    // read package.json base version
    const pkgPath = path.join(process.cwd(), 'package.json')
    const raw = fs.readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(raw)
    const baseVersion = pkg.version || '0.0.0'

    // 2) try to compute build metadata from git commit count (useful in local dev)
    try {
      // require child_process lazily so environments without it don't fail at import time
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { execSync } = require('child_process')
      const count = execSync('git rev-list --count HEAD', { cwd: process.cwd() })
        .toString()
        .trim()
      if (count) {
        const generated = `${baseVersion}+build.${count}`
        return NextResponse.json({ version: generated })
      }
    } catch (_) {
      // ignore git errors and fall back to package.json version
    }

    // 3) fallback to package.json version
    return NextResponse.json({ version: baseVersion })
  } catch (err) {
    return NextResponse.json({ version: '0.0.0' })
  }
}
