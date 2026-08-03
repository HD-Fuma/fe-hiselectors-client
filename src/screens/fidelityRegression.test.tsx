import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error Vitest runs this file in Node; the app intentionally omits @types/node.
import { existsSync, readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const tokensCss = readFileSync(`${workspaceRoot}/src/styles/tokens.css`, 'utf8') as string
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8') as string
const compactCss = globalCss.replace(/\s+/g, ' ')

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('reference typography and packaged font', () => {
  it('declares the local variable face and the exact global baseline', () => {
    expect(tokensCss).toMatch(/@font-face\s*{[^}]*font-family:\s*pretendard;[^}]*src:\s*url\('\.\.\/assets\/fonts\/PretendardVariable\.woff2'\) format\('woff2'\);[^}]*font-style:\s*normal;[^}]*font-weight:\s*45 920;[^}]*font-display:\s*swap;/s)
    expect(tokensCss).toContain('font-family: pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif;')
    expect(compactCss).toMatch(/body \{[^}]*font-size: 14px;[^}]*font-weight: 400;[^}]*line-height: 1\.4;[^}]*letter-spacing: -0\.25px;/)
    expect(compactCss).toMatch(/html \{[^}]*-webkit-font-smoothing: antialiased;/)
    expect(compactCss).toMatch(/\.panel-header h1 \{[^}]*font-size: 18px;[^}]*font-weight: 500;[^}]*line-height: 22\.5px;/)
    expect(compactCss).toMatch(/\.aside-tile \{[^}]*font-size: 14px;[^}]*font-weight: 400;/)
    const numericWeights = Array.from(
      globalCss.matchAll(/font-weight:\s*(\d+)\s*;/g),
      (match) => Number(match[1]),
    )
    expect(numericWeights.length).toBeGreaterThan(0)
    expect(numericWeights.every((weight) => [400, 500, 600, 700].includes(weight))).toBe(true)
  })

  it('packages a real WOFF2 and the complete OFL text', () => {
    const fontPath = `${workspaceRoot}/src/assets/fonts/PretendardVariable.woff2`
    const licensePath = `${workspaceRoot}/public/fonts/OFL.txt`
    const canonicalLicensePath = `${workspaceRoot}/node_modules/pretendard/dist/LICENSE.txt`
    expect(existsSync(fontPath)).toBe(true)
    expect(existsSync(licensePath)).toBe(true)
    expect(existsSync(canonicalLicensePath)).toBe(true)
    const signature = Array.from((readFileSync(fontPath) as Uint8Array).subarray(0, 4))
      .map((byte) => String.fromCharCode(byte)).join('')
    const packagedLicense = readFileSync(licensePath) as Uint8Array
    const canonicalLicense = readFileSync(canonicalLicensePath) as Uint8Array
    expect(signature).toBe('wOF2')
    expect(packagedLicense.byteLength).toBe(canonicalLicense.byteLength)
    expect(packagedLicense.every((byte, index) => byte === canonicalLicense[index])).toBe(true)
    expect(readFileSync(licensePath, 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('keeps the approved login and application landmarks after the baseline change', () => {
    window.location.hash = '#/login'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '로그인' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy()
    cleanup()
    window.location.hash = '#/apply/form'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    expect(within(screen.getByRole('main')).getByText('나의 대표 SNS')).toBeTruthy()
  })
})
