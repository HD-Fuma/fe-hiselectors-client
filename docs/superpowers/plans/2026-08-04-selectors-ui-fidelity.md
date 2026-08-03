# Selectors UI Fidelity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the approved TheHyundai login/application shell typography and frame, remove the campaign-only commission claim, and deliver reference-faithful public/owner Selectors Shop screens with complete UI-only product-group management.

**Architecture:** `App` owns one `ShopDemoProvider` above hash-routed screens so reducer state survives route changes but resets on remount/reload. Static profile, campaign, and product fixtures live in `src/shop/shopData.ts`; reducer state owns only groups, status, the quick-add draft, and generated-ID serial. Focused route screens compose accessible product-grid, group-section, menu, sheet, and dialog components. Shared typography/frame stay in the global token layer; all shop-only presentation goes in `src/styles/shop.css`.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 4, Testing Library, CSS, Pretendard Variable 1.3.9.

---

## Chunk 1: Shared typography, frame, and campaign copy

### Task 1: Self-host Pretendard and lock the measured type tokens

**Files:**
- Create: `src/screens/fidelityRegression.test.tsx`
- Create: `src/assets/fonts/PretendardVariable.woff2`
- Create: `public/fonts/OFL.txt`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`

- [ ] Add `src/screens/fidelityRegression.test.tsx` with the complete file-reading setup below; this is the only Node shim needed because the app intentionally has no `@types/node` dependency:

```tsx
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error Vitest runs this file in Node; the app intentionally omits @types/node.
import { existsSync, readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const tokensCss = readFileSync(`${workspaceRoot}/src/styles/tokens.css`, 'utf8')
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8')
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
    expect(existsSync(fontPath)).toBe(true)
    expect(existsSync(licensePath)).toBe(true)
    const signature = Array.from(readFileSync(fontPath).subarray(0, 4))
      .map((byte) => String.fromCharCode(byte)).join('')
    expect(signature).toBe('wOF2')
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
```

- [ ] Run `npm test -- --run src/screens/fidelityRegression.test.tsx`; expect failures for the missing `@font-face`, missing assets, `line-height: 1.45`, header `16px/700`, aside `16px/700`, and unsupported weights.

- [ ] Run `npm install --save-dev --save-exact pretendard@1.3.9`; expect `package.json` to contain exactly `"pretendard": "1.3.9"` and the lockfile to resolve 1.3.9.

- [ ] Create the two asset directories with `mkdir -p src/assets/fonts public/fonts`, then copy the binary with `cp node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 src/assets/fonts/PretendardVariable.woff2` and the package license with `cp node_modules/pretendard/LICENSE public/fonts/OFL.txt`; run `xxd -l 4 -p src/assets/fonts/PretendardVariable.woff2` and expect `774f4632`, then `rg -n "SIL OPEN FONT LICENSE Version 1.1" public/fonts/OFL.txt` and expect one match.

- [ ] Patch `src/styles/tokens.css` so its first rule is the exact local face below, and replace the root family with the exact measured stack. Remove `font-synthesis: none` and `text-rendering: optimizeLegibility` because they are not part of the reference baseline.

```css
@font-face {
  font-family: pretendard;
  src: url('../assets/fonts/PretendardVariable.woff2') format('woff2');
  font-style: normal;
  font-weight: 45 920;
  font-display: swap;
}

:root {
  font-family: pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif;
}
```

- [ ] Patch the existing `html`, `body`, `.panel-header h1`, and `.aside-tile` rules in `src/styles/global.css`: add `-webkit-font-smoothing: antialiased` to `html`; set `body` to `font-size: 14px`, `font-weight: 400`, `line-height: 1.4`, and `letter-spacing: -0.25px`; set the header to `18px/500/22.5px`; set the aside tile to `14px/400`. Change only `.apply-hero h2`, `.apply-flow .is-active`, and `.selector-avatar` from 750/800 to 700.

- [ ] Run `npm test -- --run src/screens/fidelityRegression.test.tsx src/screens/loginReference.test.tsx src/screens/applyReference.test.tsx`; expect all tests green.

- [ ] Run `npm run build`, then run the command below. It must fail unless there is exactly one hashed Pretendard asset, its signature is `wOF2`, and the emitted license is byte-for-byte identical to the packaged source; expect the single success line shown.

```bash
node --input-type=module -e 'import { existsSync, readFileSync, readdirSync } from "node:fs"; const fonts = readdirSync("dist/assets").filter((name) => /^PretendardVariable-[A-Za-z0-9_-]+\.woff2$/.test(name)); if (fonts.length !== 1) throw new Error(`expected one hashed Pretendard WOFF2, found ${fonts.length}`); const signature = readFileSync(`dist/assets/${fonts[0]}`).subarray(0, 4).toString("ascii"); if (signature !== "wOF2") throw new Error(`bad built font signature: ${signature}`); if (!existsSync("dist/fonts/OFL.txt")) throw new Error("missing dist/fonts/OFL.txt"); if (!readFileSync("dist/fonts/OFL.txt").equals(readFileSync("public/fonts/OFL.txt"))) throw new Error("built license differs from source"); console.log(`verified ${fonts[0]} and dist/fonts/OFL.txt`);'
```

Expected: `verified PretendardVariable-<hash>.woff2 and dist/fonts/OFL.txt`.

- [ ] Commit only these files with `git add package.json package-lock.json src/assets/fonts/PretendardVariable.woff2 public/fonts/OFL.txt src/styles/tokens.css src/styles/global.css src/screens/fidelityRegression.test.tsx && git commit -m "fix: align shared typography with reference"`.

### Task 2: Correct the panel frame and campaign commission copy

**Files:**
- Modify: `src/screens/fidelityRegression.test.tsx`
- Modify: `src/screens/referenceRegression.test.tsx`
- Modify: `src/screens/CampaignScreens.tsx`
- Modify: `src/styles/global.css`

- [ ] Extend `fidelityRegression.test.tsx` with the three independent tests below. They deliberately separate the RED campaign removal from the already-green reporting preservation. Existing imports already include `cleanup`, `render`, `screen`, and `within`.

```tsx
describe('shared panel and campaign fidelity', () => {
  it('uses one outer frame without a header divider and removes it on mobile', () => {
    const baseCss = globalCss.slice(0, globalCss.indexOf('@media'))
    const panelRule = baseCss.match(/\.client-panel\s*{([^}]*)}/)?.[1] ?? ''
    const headerRule = baseCss.match(/\.panel-header\s*{([^}]*)}/)?.[1] ?? ''
    const bottomRule = baseCss.match(/\.bottom-action\s*{([^}]*)}/)?.[1] ?? ''
    const mobileCss = globalCss.slice(globalCss.indexOf('@media (max-width: 480px)'))
    const mobilePanelRule = mobileCss.match(/\.client-panel\s*{([^}]*)}/)?.[1] ?? ''

    expect(panelRule).toContain('border: 1px solid var(--line);')
    expect(panelRule).toContain('box-shadow: none;')
    expect(panelRule).not.toContain('border-left: 0;')
    expect(panelRule).not.toContain('border-right: 0;')
    expect(panelRule).not.toContain('inset 1px 0 var(--line)')
    expect(headerRule).toContain('border-bottom: 0;')
    expect(bottomRule).toContain('border-top: 1px solid var(--line-soft);')
    expect(mobilePanelRule).toContain('border: 0;')
    expect(mobilePanelRule).toContain('box-shadow: none;')
  })

  it('removes only the campaign activity-commission claim', () => {
    window.location.hash = '#/campaigns/detail'
    render(<App />)
    expect(screen.queryByText('활동 수수료')).toBeNull()
    expect(screen.queryByText('상품별 최대 8%')).toBeNull()
    const details = screen.getByText('캠페인 기간').closest('dl')
    expect(details?.children).toHaveLength(1)
  })

  it('retains aggregate, product-level, and settlement commission reporting', () => {
    window.location.hash = '#/performance'
    render(<App />)
    expect(screen.getByText('예상 정산 수수료')).toBeTruthy()

    cleanup()
    window.location.hash = '#/performance/products'
    render(<App />)
    const table = screen.getByRole('table', { name: '상품별 성과 지표' })
    expect(within(table).getByRole('cell', { name: '예상 수수료 324,800원' })).toBeTruthy()

    cleanup()
    window.location.hash = '#/settlement'
    render(<App />)
    expect(screen.getByText('8월 예상 정산 금액')).toBeTruthy()
  })
})
```

- [ ] Run `npm test -- --run src/screens/fidelityRegression.test.tsx`; expect the frame test to fail on the old inset shadow/header/mobile rules, the removal test to fail on the two campaign strings, and the independent reporting test to pass.

- [ ] In `referenceRegression.test.tsx`, replace the old assertion that requires `border-right: 0`, `border-left: 0`, and inset shadows with exact assertions for desktop `border: 1px solid var(--line)` plus `box-shadow: none`, header `border-bottom: 0`, and mobile `border: 0` plus `box-shadow: none`. Keep the existing width, grid, header alignment, bottom-action sizing, focus, and responsive-width checks unchanged.

- [ ] In `global.css`, change only the base `.client-panel` frame to `border: 1px solid var(--line)` and `box-shadow: none`, change `.panel-header` to `border-bottom: 0`, and change the `@media (max-width: 480px)` `.client-panel` rule to `border: 0`. Do not remove `.bottom-action`'s top border.

- [ ] In `CampaignScreens.tsx`, delete only `<div><dt>활동 수수료</dt><dd>상품별 최대 8%</dd></div>`; leave the campaign period, brand chips, products, performance screens, and settlement screen untouched.

- [ ] Run `npm test -- --run src/screens/fidelityRegression.test.tsx src/screens/referenceRegression.test.tsx src/screens/qualityRegression.test.tsx`; expect green, then run `npm test -- --run`; expect the current complete suite green.

- [ ] Commit with `git add src/screens/fidelityRegression.test.tsx src/screens/referenceRegression.test.tsx src/screens/CampaignScreens.tsx src/styles/global.css && git commit -m "fix: correct panel frame and campaign copy"`.

## Chunk 2: Demo state and canonical routes

### Task 3: Lock exact fixtures before adding state

**Files:**
- Create: `src/shop/shopData.ts`
- Create: `src/shop/ShopDemoContext.test.tsx`
- Modify: `src/screens/productData.ts`

- [ ] Create `ShopDemoContext.test.tsx` with `describe('shop fixture contract')` and imports from the not-yet-created `shopData`. Assert the profile equals `{name:'byunjjii',meSpaceLabel:'byunjjii의 ME스페이스',badgeAlt:'인플루언서 뱃지',badgeImage:'https://image.thehyundai.com/images/badge/badge_manager_large.png?SF=webp&AO=1',verified:true}`. Assert ordered product IDs exactly `[knit-ivory, knit-blue, knit-midnight, cologne-blackberry, cologne-pear, cologne-frangipani, jewelry-fullmoon, jewelry-flower, jewelry-hlink, earring-essence, earring-souvenir]` and categories `[패션,패션,패션,뷰티,뷰티,뷰티,주얼리,주얼리,주얼리,주얼리,주얼리]`.

- [ ] In the same failing test, project each product to `[id,originalPrice,discountRate,salePrice,campaignIds]` and assert: each knit [`189,000원`,`20%`,`151,200원`,[season-pick]]; blackberry [`245,000원`,`5%`,`232,750원`,[season-pick,fragrance-note]]; pear [`110,000원`,`5%`,`104,500원`,[fragrance-note]]; frangipani [`114,000원`,`5%`,`108,300원`,[fragrance-note]]; each legacy jewelry its tuples [`70,000원`,`15%`,`59,500원`], [`140,000원`,`15%`,`119,000원`], [`110,000원`,`15%`,`93,500원`] with [jewelry-focus]; essence [`90,000원`,`15%`,`76,500원`,[jewelry-focus]]; souvenir [`150,000원`,`15%`,`127,500원`,[jewelry-focus]]. Assert essence brand/name/image exactly `이에르로르` / `에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX` / `https://image.thehyundai.com/4/3/9/09/A2/60A2099341_0.jpg?RS=375x375&AR=0&SF=webp&AO=1`, and souvenir exactly `''` / `[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX` / `https://image.thehyundai.com/0/6/3/12/B1/60B1123606_0.jpg?RS=375x375&AR=0&SF=webp&AO=1`.

- [ ] Assert campaign projections exactly `season-pick / 여름의 결을 고르는 시즌 픽:[knit-ivory,knit-blue,knit-midnight,cologne-blackberry]`, `fragrance-note / 은은하게 오래 남는 향:[cologne-blackberry,cologne-pear,cologne-frangipani]`, and `jewelry-focus / 매일을 빛내는 작은 주얼리:[jewelry-fullmoon,jewelry-flower,jewelry-hlink,earring-essence,earring-souvenir]`. Assert all 13 group objects including `id`, `name`, `createdAt:'2026.08.04'`, explicit `campaignId`, and product IDs in this order: `1 귀걸이 jewelry-focus [earring-essence,earring-souvenir]`; `2 여름의 결 season-pick [knit-ivory,knit-blue]`; `3 블루 니트 season-pick [knit-midnight]`; `4 블랙베리 향 season-pick [cologne-blackberry]`; `5 프리지아 fragrance-note [cologne-pear]`; `6 프랑지파니 fragrance-note [cologne-frangipani]`; `7 샴페인 주얼리 jewelry-focus [jewelry-fullmoon]`; `8 플라워 브레이슬릿 jewelry-focus [jewelry-flower]`; `9 H 링크 jewelry-focus [jewelry-hlink]`; `10 스타일 셀렉션 null [knit-ivory,earring-essence]`; `11 향의 기록 fragrance-note [cologne-blackberry,cologne-pear]`; `12 선물 추천 null [jewelry-fullmoon,cologne-frangipani]`; `13 오늘의 픽 null [knit-blue,jewelry-hlink]`.

- [ ] Run `npm test -- --run src/shop/ShopDemoContext.test.tsx -t "shop fixture contract"`; expect module-not-found RED for `shopData`.

- [ ] Implement readonly `SelectorProfile`, `ShopProduct`, `ShopCampaign`, and `ShopGroup` types plus the exact fixtures asserted above in `shopData.ts`. Retain the original nine brand/name/image values; add live essence/souvenir names, images, and prices exactly as measured. The live profile visual is only the exact 32px badge; no portrait fixture is added.

- [ ] Change `productData.ts` to derive only the legacy first nine products: `export const shopProducts = selectorProducts.slice(0, 9).map((product) => ({...product, price: product.salePrice}))`. This keeps every pre-rebuild campaign/performance/public screen and its existing nine-card test green while `ShopDemoContext` later consumes all 11 canonical `selectorProducts`.

- [ ] Run `npm test -- --run src/shop/ShopDemoContext.test.tsx src/screens/shopReference.test.tsx src/screens/screens.test.tsx`; expect fixture green and the unchanged nine-card/UI contracts green. Run `npm run build`; expect green.

- [ ] Commit with `git add src/shop/shopData.ts src/shop/ShopDemoContext.test.tsx src/screens/productData.ts && git commit -m "feat: define selectors shop fixtures"`.

### Task 4: Add reducer and provider lifetime

**Files:**
- Create: `src/shop/ShopDemoContext.tsx`
- Modify: `src/shop/ShopDemoContext.test.tsx`

- [ ] Before creating the context, extend the test with reducer cases for: fresh initialization (13 groups, serial 14, null status/draft, distinct group/object/productIds references across two initial states without mutating readonly fixtures); trimmed rename/update; missing rename/update/add/delete returning the identical state object; create IDs `demo-14` then `demo-15` with date `2026.08.04`; dedup order `[knit-ivory,earring-essence,knit-blue,knit-midnight]`; delete; cloned draft set/clear; status set/clear. Add a `StateProbe` using the future hook that invokes all eight public actions and renders JSON.

- [ ] Run `npm test -- --run src/shop/ShopDemoContext.test.tsx -t "shop reducer|shop provider"`; expect module-not-found RED for `ShopDemoContext`.

- [ ] Implement the exact contracts below. `ShopGroup` remains a readonly fixture shape; mutable reducer state uses a separate `ShopDemoGroup` so tests never cast away readonly.

```ts
export type ShopDemoGroup = Omit<ShopGroup, 'productIds'> & { productIds: string[] }
export type QuickAddDraft = { campaignId: string; productIds: string[] }
export type ShopDemoState = { groups: ShopDemoGroup[]; status: string | null; quickAddDraft: QuickAddDraft | null; nextGroupSerial: number }
export type GroupInput = { name: string; campaignId: string | null; productIds: string[] }
export type ShopDemoAction =
  | { type:'renameGroup'; groupId:string; name:string }
  | { type:'updateGroupProducts'; groupId:string; input:GroupInput }
  | { type:'createGroup'; input:GroupInput }
  | { type:'addProductsToGroup'; groupId:string; productIds:string[] }
  | { type:'deleteGroup'; groupId:string }
  | { type:'setQuickAddDraft'; draft:QuickAddDraft }
  | { type:'clearQuickAddDraft' }
  | { type:'setStatus'; status:string|null }
```

- [ ] Export `ShopDemoContextValue` with `state`, readonly `profile/products/campaigns`, `getGroup`, `getProducts`, and exactly `renameGroup`, `updateGroupProducts`, `createGroup`, `addProductsToGroup`, `deleteGroup`, `setQuickAddDraft`, `clearQuickAddDraft`, `setStatus`. `createInitialShopDemoState` deep-clones groups and membership, returns serial 14/null transient fields. Reducer trims names, makes missing targets referential no-ops, preserves dedup order, appends `demo-${serial}`, uses fixed date, and never accesses network/storage/cookies/history.

- [ ] Run `npm test -- --run src/shop/ShopDemoContext.test.tsx`; expect every fixture/reducer/provider case green, including provider unmount/fresh mount resetting to 13 groups/serial 14. Run `npm run build`; expect green.

- [ ] Commit with `git add src/shop/ShopDemoContext.tsx src/shop/ShopDemoContext.test.tsx && git commit -m "feat: add selectors shop demo provider"`.

### Task 5: Add canonical route modes and missing-group states

**Files:**
- Create: `src/screens/shop/GroupEditorScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/screenRegistry.ts`
- Modify: `src/screenRegistry.test.ts`
- Modify: `src/screens/CatalogScreen.tsx`
- Modify: `src/screens/index.tsx`
- Modify: `src/screens/ShopScreens.tsx`
- Modify: `src/screens/screens.test.tsx`
- Modify: `src/screens/referenceRegression.test.tsx`
- Modify: `src/screens/shopReference.test.tsx`

- [ ] First add failing registry/render tests for the exact six paths/IDs: public `#/shop/RC000003200T`; owner `#/shop/RC000003200T/1`; overview `#/shop/groups`; create `#/shop/groups/new`; edit `#/shop/groups/1/edit`; campaign-create `#/shop/groups/new/season-pick`. The legacy alias is absent from the registry/catalog. Each editor render asserts an observable `[data-editor-mode]`, exact `data-group-id`/`data-initial-campaign`, and back href matching this discriminated type:

```ts
export type GroupEditorMode =
  | {kind:'create';backHref:'#/shop/groups';initialCampaignId:null}
  | {kind:'edit';groupId:'1';backHref:'#/shop/RC000003200T/1'}
  | {kind:'campaign-create';backHref:'#/campaigns/detail';initialCampaignId:'season-pick'}
```

- [ ] Add failing missing-route tests with a real provider/test delete button. Owner missing expects h1 `셀렉터스샵`; edit missing expects h1 `상품 그룹 편집`; both expect exact `상품 그룹을 찾을 수 없습니다.`, public return link, and no stale card/form. Run `npm test -- --run src/screenRegistry.test.ts src/screens/screens.test.tsx`; expect RED for all new IDs/components.

- [ ] Implement the registry entries, `screens/index.tsx` mappings, exhaustive catalog metadata, provider placement as `<ShopDemoProvider><RoutedApp shopProbe={shopProbe}/></ShopDemoProvider>`, provider-backed owner/overview missing states, and the focused minimal `GroupEditorScreen` whose DOM exposes the tested mode attributes. Preserve the existing reference-regression checkbox proxy contract as adjacent `.picker-row input + .product-check` markup until Task 8 replaces the minimal editor with the complete picker. `ShopScreens.tsx` imports/re-exports route wrappers; no same-module wrapper spy is used.

- [ ] Mechanically change old reference paths in `screens.test.tsx`, `referenceRegression.test.tsx`, and `shopReference.test.tsx` from RC000004900T to RC000003200T and from the legacy edit hash to create. Keep old public identity/card assertions until Chunk 3 rebuilds them.

- [ ] Run `npm test -- --run src/screenRegistry.test.ts src/screens/screens.test.tsx src/screens/referenceRegression.test.tsx src/screens/shopReference.test.tsx`; expect green. Run `npm run build`; expect exhaustive records and mode types green.

- [ ] Add a failing legacy redirect/continuity test before canonicalization. `App` accepts optional `shopProbe: ReactNode` only for test observation; a probe uses `useShopDemo`, renames group `1` to `별칭 유지`, and renders it. Start at overview, mutate, navigate to `#/shop/groups/edit`, fire one hashchange, then assert canonical `#/shop/groups/new`, probe still `별칭 유지`, and `history.replaceState` called exactly once. Fire another hashchange and assert the call count remains one and there is still one route announcement. Expect RED because the hash remains legacy.

- [ ] Implement `canonicalizeHash` mapping only the legacy hash to create. Initial selection and hashchange both canonicalize; differing hashes call `history.replaceState(window.history.state,'',canonicalHash)` before selection. Do not key `App`, provider, shell, or screen by route.

- [ ] Run the focused legacy test; expect green. Run the four route/reference files plus `ShopDemoContext.test.tsx` and `npm run build`; expect green.

- [ ] Commit with `git add src/App.tsx src/screenRegistry.ts src/screenRegistry.test.ts src/screens/CatalogScreen.tsx src/screens/index.tsx src/screens/ShopScreens.tsx src/screens/shop/GroupEditorScreen.tsx src/screens/screens.test.tsx src/screens/referenceRegression.test.tsx src/screens/shopReference.test.tsx && git commit -m "feat: add canonical selectors shop routes"`.

## Chunk 3: Public and owner shop experiences

### Task 6: Split shop components and match the public reference

**Files:**
- Create: `src/shop/ShopProductGrid.tsx`
- Create: `src/shop/ShopGroupSection.tsx`
- Create: `src/shop/ShopStatus.tsx`
- Create: `src/shop/ShareShopSheet.tsx`
- Create: `src/shop/useModalFocus.ts`
- Create: `src/shop/useModalFocus.test.tsx`
- Create: `src/screens/shop/PublicShopScreen.tsx`
- Create: `src/screens/shop/PublicShopScreen.test.tsx`
- Create: `src/styles/shop.css`
- Modify: `src/App.tsx`
- Modify: `src/screens/ShopScreens.tsx`
- Modify: `src/screens/shopReference.test.tsx`
- Modify: `src/screens/referenceRegression.test.tsx`
- Modify: `src/styles/global.css`

- [ ] Add only `public reference content` to `PublicShopScreen.test.tsx`: render RC000003200T and assert header/back/share; exact 32px `인플루언서 뱃지`; `byunjjii`; ME button; ordered fixture headings 1–6; the two exact live card image/brand/name/original/15%/sale values; and exact disclosure. Run `npm test -- --run src/screens/shop/PublicShopScreen.test.tsx -t "public reference content"`; expect RED on the old identity/category screen.

- [ ] Implement `ShopProductGrid` to map IDs through context and render a two-column `<article>` card with image, brand, full name, `<del>` original price, discount rate, and strong sale price. Implement `ShopGroupSection` as a stable keyed `<section>` with heading, optional owner action slot, and `ShopProductGrid`.

- [ ] Implement `ShopStatus` as an atomic `role=status`, then implement public reference content only: exact badge/handle/ME metrics, six context groups, grid/cards, disclosure, and provider status. Rerun the named content test; expect green.

- [ ] Add only `appends six groups without replacing prior DOM`: save the first six section nodes, set scroller scrollTop 318, click `더보기`, assert 12 ordered sections/first-six node identity/scrollTop 318; click again, assert 13 and no button. Run the named test; expect RED because the button is absent.

- [ ] Add only conditional `더보기` with `setVisibleCount((count) => Math.min(count + 6, groups.length))`; never call a scroll API. Rerun the named expansion test; expect green.

- [ ] Create a hook harness test before the hook: outside invoker opens a dialog containing first/last buttons; assert first focus, Shift+Tab→last, Tab→first, Escape closes/restores invoker. Run `npm test -- --run src/shop/useModalFocus.test.tsx`; expect module-not-found RED.

- [ ] Implement `useModalFocus({containerRef,invokerRef,onClose})` with enabled-control discovery, initial focus, Tab wraps, safe Escape, listener cleanup, and explicit invoker restoration. Rerun hook test; expect green.

- [ ] Add only `public share is UI-only`: set configurable `navigator.clipboard.writeText=vi.fn()`, `navigator.share=vi.fn()`, and stub `fetch=vi.fn()`; open header share; assert labelled modal/title/exact URL/copy/close; copy status; all three spies uncalled; Escape restores trigger. Restore globals/mocks in `afterEach`. Run the named test; expect RED because no sheet opens.

- [ ] Implement `ShareShopSheet` with exact props `{title,url,onClose,invokerRef: RefObject<HTMLElement|null>}`, accessible modal/read-only URL/local status, and the focus hook. Public passes its header-button ref. Rerun public-share and hook tests; expect green.

- [ ] Move `PublicShopScreen` ownership to `src/screens/shop/PublicShopScreen.tsx`; change old `ShopScreens.tsx` to re-export the focused route module instead of containing its markup. Import `./styles/shop.css` once from `App.tsx`; do not add the visual rules yet.

- [ ] Update `shopReference.test.tsx` from old RC000004900T/오셀렉터스/category assumptions to RC000003200T/byunjjii/group-section assertions. Keep the existing HiHi aside geometry assertions. Add CSS contracts for 52px header, 16px horizontal content inset, a two-column `168px 168px` grid with 16px gap at desktop/mobile, square 168px images, 18px/700/24px group headings, and the original/discount/sale price hierarchy; assert the disclosure is 13px/18px. In `referenceRegression.test.tsx`, also read/compact `src/styles/shop.css`, keep `.custom-check` focus against global CSS, and move the `.product-check` focus assertion to the shop CSS string before the declarations migrate.

- [ ] Run `npm test -- --run src/screens/shopReference.test.tsx -t "reference shop geometry"`; expect RED because `shop.css` does not yet implement the measured geometry and hierarchy.

- [ ] Move the legacy shop-only declarations out of `global.css` while implementing the exact contracts in `shop.css`: split `.editor-section > input` from `.application-form input`; split `.picker-row`/`.product-check` from the terms checkbox rules; split `.public-product` from `.campaign-product`; move the complete shop-group, group-editor, public-shop, and their mobile override blocks. Keep campaign, terms, application, month-selector, performance, and all non-shop declarations in `global.css`. Confirm with `rg -n "shop-|selector-|public-|group-|editor-|picker-|product-check|me-space" src/styles/global.css` that no shop-only selector remains, then rerun the named geometry test; expect green.

- [ ] Run `npm test -- --run src/screens/shop/PublicShopScreen.test.tsx src/shop/useModalFocus.test.tsx src/screens/shopReference.test.tsx`; expect green. Run the full suite; expect no login/application/campaign/catalog regressions.

- [ ] Commit with `git add src/shop/ShopProductGrid.tsx src/shop/ShopGroupSection.tsx src/shop/ShopStatus.tsx src/shop/ShareShopSheet.tsx src/shop/useModalFocus.ts src/shop/useModalFocus.test.tsx src/screens/shop/PublicShopScreen.tsx src/screens/shop/PublicShopScreen.test.tsx src/styles/shop.css src/styles/global.css src/App.tsx src/screens/ShopScreens.tsx src/screens/shopReference.test.tsx src/screens/referenceRegression.test.tsx && git commit -m "feat: rebuild public selectors shop"`.

### Task 7: Match the owner route, overview, share, rename, and delete flows

**Files:**
- Create: `src/shop/ShopGroupMenu.tsx`
- Create: `src/shop/RenameGroupDialog.tsx`
- Create: `src/shop/DeleteGroupDialog.tsx`
- Create: `src/screens/shop/OwnerShopGroupScreen.tsx`
- Create: `src/screens/shop/ShopGroupsScreen.tsx`
- Create: `src/screens/shop/OwnerShopGroupScreen.test.tsx`
- Modify: `src/screens/ShopScreens.tsx`
- Modify: `src/styles/shop.css`

- [ ] Add only `owner reference and menu keyboard`: no public profile/ME; exact group/cards/disclosure; trigger false→true; exact four items; first focus; ArrowDown/Up wrap; Home/End; outside close; Escape close/trigger restore; edit destination. Run the named test; expect RED.

- [ ] Implement `ShopGroupMenu` as an anchored native-button menu with `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, the exact four actions/order, initial first-item focus, wrapping ArrowUp/ArrowDown plus Home/End navigation, outside-pointer dismissal, Escape dismissal, and focus restoration. Share and dialog actions close the menu before opening the next surface while retaining their own invoker refs.

- [ ] Implement owner composition and menu only, including `ShopStatus` so later edit status is visible. Rerun the owner/menu test; expect green.

- [ ] Add only `shares from both owner entry points`: header and menu each open the same `상품 그룹 공유` sheet/exact `/1` URL; UI-only copy; Escape restores header trigger or menu trigger. Run it; expect RED.

- [ ] Connect one sheet instance and set an explicit active invoker ref before closing the menu/opening the sheet. Rerun owner-share; expect green.

- [ ] Add only `renames with accessible validation`: initial `귀걸이`/`3 / 30`; first focus input; Tab/Shift+Tab wrap; spaces show exact alert and disabled save; Escape preserves/restores; reopen/save `새 귀걸이 ` and assert trimmed heading. Run it; expect RED.

- [ ] Implement `RenameGroupDialog` with focus hook, count/maxLength, live error, disabled save, cancel/Escape, trim/save. Rerun rename; expect green.

- [ ] Add only `cancels and confirms named deletion`: exact title/body, Tab wrap, Escape and Cancel preserve/restore; Confirm deletes/routes public/status; direct owner/edit show route-specific headings, exact missing message/public link, no stale UI. Run it; expect RED.

- [ ] Implement `DeleteGroupDialog` with focus hook and delete sequence `deleteGroup` → `setStatus` → public hash. Rerun deletion/missing; expect green.

- [ ] Add only `lists provider-backed overview`: 13 ordered summaries/exact counts/dates, group 1 owner link, sticky create link. Run it; expect RED on legacy local data.

- [ ] Implement `ShopGroupsScreen` from context only and re-export focused screens. Rerun overview; expect green.

- [ ] Add App lifetime test: rename to `SPA 유지`; hash-navigate public/back and legacy alias without remount; assert name retained/canonical hash; unmount/remount and assert 13 original groups/`귀걸이`. Run it; expect green from provider architecture; if RED, patch only provider placement/route keying and rerun.

- [ ] Add owner/menu/dialog/overview rules to `shop.css`, including the reference two-column grid, 52px header continuity, anchored menu, bottom-sheet/dialog geometry, focus indicators, and mobile max-width/overflow rules.

- [ ] Run `npm test -- --run src/screens/shop/OwnerShopGroupScreen.test.tsx src/screens/screens.test.tsx`; expect green. Run `npm run build`; expect no type errors.

- [ ] Commit with `git add src/shop/ShopGroupMenu.tsx src/shop/RenameGroupDialog.tsx src/shop/DeleteGroupDialog.tsx src/screens/shop/OwnerShopGroupScreen.tsx src/screens/shop/ShopGroupsScreen.tsx src/screens/shop/OwnerShopGroupScreen.test.tsx src/screens/ShopScreens.tsx src/styles/shop.css && git commit -m "feat: add owner shop group management"`.

## Chunk 4: Group editor, campaign shortcut, and final verification

### Task 8: Build the shared create/edit editor and defensive quick-add draft flow

**Files:**
- Create: `src/shop/GroupProductPicker.tsx`
- Modify: `src/screens/shop/GroupEditorScreen.tsx`
- Create: `src/screens/shop/GroupEditorScreen.test.tsx`
- Modify: `src/components/PanelHeader.tsx`
- Modify: `src/components/BottomAction.tsx`
- Modify: `src/screens/ShopScreens.tsx`
- Modify: `src/styles/shop.css`

- [ ] Add only `initializes all editor modes`: create empty/all/0/disabled/back overview; edit `귀걸이`/jewelry-focus/two earring checks/enabled/back owner; direct campaign-create without draft season-pick/0/back campaign.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "initializes all editor modes"`; expect RED on the minimal route marker.

- [ ] Implement controlled name/filter/selected state and `GroupProductPicker`; extend PanelHeader/BottomAction handlers; populate exact discriminated modes.

- [ ] Rerun the named initialization test; expect green.

- [ ] Add only `preserves off-filter selection`: select two IDs, switch `fragrance-note`, count remains two and hidden checks are absent, return `전체 캠페인`, both remain checked. Direct-render picker with `products=[]` and assert exact empty copy.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "preserves off-filter selection"`; expect RED on unimplemented filtering.

- [ ] Implement derived visible products without mutating the selected set; picker owns count/empty presentation.

- [ ] Rerun the named filtering test; expect green.

- [ ] Add only `requires valid name and one product`: whitespace alert, maxLength 30, zero-product alert, disabled save causes no hash/state change.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "requires valid name and one product"`; expect RED.

- [ ] Implement touched/error state and `canSave` from trimmed 1–30 name plus ≥1 product.

- [ ] Rerun the named validation test; expect green.

- [ ] Add only `creates a trimmed group`: valid name/product saves `demo-14`, routes public, shows `상품 그룹을 만들었어요.`.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "creates a trimmed group"`; expect RED.

- [ ] Implement create/status/clear/route.

- [ ] Rerun the named create test; expect green.

- [ ] Add only `updates an existing group`: change edit name/membership, save, route owner, assert updated content and visible `상품 그룹을 수정했어요.`.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "updates an existing group"`; expect RED.

- [ ] Implement update/status/clear/route.

- [ ] Rerun the named update test; expect green.

- [ ] Add exact `Back clears draft and follows each mode destination` tests for all modes; each asserts destination and a `clearQuickAddDraft` spy/captured state. Missing edit asserts h1 `상품 그룹 편집`, exact fallback/link, and no form.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx -t "Back clears draft"`; expect RED because Back does not yet clear the draft defensively.

- [ ] Wire each Back action to clear the draft before following its mode destination; implement the missing-edit fallback without rendering stale form markup.

- [ ] Rerun the named Back/missing test; expect green.

- [ ] Re-export three wrappers from `ShopScreens.tsx` using their exact discriminated props. Add editor form, native select, two-column checkbox picker, selected count, errors, disabled sticky action, and mobile overflow rules only to `shop.css`.

- [ ] Run `npm test -- --run src/screens/shop/GroupEditorScreen.test.tsx src/shop/ShopDemoContext.test.tsx`; expect green, then `npm run build`; expect green.

- [ ] Commit with `git add src/shop/GroupProductPicker.tsx src/screens/shop/GroupEditorScreen.tsx src/screens/shop/GroupEditorScreen.test.tsx src/components/PanelHeader.tsx src/components/BottomAction.tsx src/screens/ShopScreens.tsx src/styles/shop.css && git commit -m "feat: add campaign-filtered group editor"`.

### Task 9: Add the campaign quick-add sheet and prove SPA lifetime semantics

**Files:**
- Create: `src/shop/CampaignQuickAddSheet.tsx`
- Create: `src/screens/shop/ShopFlowIntegration.test.tsx`
- Modify: `src/screens/CampaignScreens.tsx`
- Modify: `src/screens/shop/GroupEditorScreen.tsx`
- Modify: `src/styles/shop.css`

- [ ] Add only `opens with four and prevents zero`: sheet has four checked season products/count four/current groups/new action; uncheck three, sole checked input disabled/count one; Escape restores trigger.

- [ ] Run `npm test -- --run src/screens/shop/ShopFlowIntegration.test.tsx -t "opens with four and prevents zero"`; expect RED.

- [ ] Implement sheet selection/focus/one-product guard and campaign trigger. `CampaignDetailScreen` renders `ShopStatus`, keeps commission absent, and adds only quick-add styles.

- [ ] Rerun the named initial-sheet test; expect green.

- [ ] Add only `adds deduplicated products to existing group`: choose `스타일 셀렉션`; sheet closes; campaign status `상품을 그룹에 담았어요.`; overview shows exact five-ID order.

- [ ] Run `npm test -- --run src/screens/shop/ShopFlowIntegration.test.tsx -t "adds deduplicated products"`; expect RED.

- [ ] Implement add/status/close.

- [ ] Rerun the named existing-group test; expect green.

- [ ] Add only `consumes a new-group draft once`: new action routes campaign-create with season/four selected; editor copies then immediately clears provider; Back/direct revisit zero; closing the campaign sheet writes no draft.

- [ ] Run `npm test -- --run src/screens/shop/ShopFlowIntegration.test.tsx -t "consumes a new-group draft once"`; expect RED.

- [ ] Implement set/copy/immediate clear/defensive Back.

- [ ] Rerun the named one-shot-draft test; expect green.

- [ ] Add only `clears draft after create save`: repeat quick-add, name/save, assert public status/group creation, direct revisit zero.

- [ ] Run `npm test -- --run src/screens/shop/ShopFlowIntegration.test.tsx -t "clears draft after create save"`; expect RED if save does not defensively clear.

- [ ] Add the defensive clear before create save.

- [ ] Rerun the named save-clear test; expect green.

- [ ] Run `npm test -- --run src/screens/shop/ShopFlowIntegration.test.tsx src/screens/fidelityRegression.test.tsx`; expect green. Run `npm test -- --run`; expect the entire suite green.

- [ ] Commit with `git add src/shop/CampaignQuickAddSheet.tsx src/screens/shop/ShopFlowIntegration.test.tsx src/screens/CampaignScreens.tsx src/screens/shop/GroupEditorScreen.tsx src/styles/shop.css && git commit -m "feat: add campaign quick-add flow"`.

### Task 10: Production build, measured browser QA, and review closure

**Files:**
- Modify only if QA/review exposes a defect: the exact source/test file responsible
- Create: `docs/superpowers/qa/2026-08-04-selectors-ui-fidelity.md`

- [ ] Run `npm test -- --run`; record total passing files/tests. Run `npm run build`; expect `tsc -b` and Vite success. Run `git diff --check`; expect no output.

- [ ] Assert packaged licensing/assets by rerunning Task 1's exact Node verifier that requires one hashed `PretendardVariable-*.woff2`, `wOF2` signature, `dist/fonts/OFL.txt`, and byte-for-byte license equality; record its single success line.

- [ ] Run `mkdir -p /private/tmp/selectors-ui-qa`. Start the reproducible server with `npm run dev`; expect `Local: http://127.0.0.1:4173/`. After reading the browser skill and viewport capability documentation, run `const viewport = await browser.capabilities.get("viewport"); await viewport.set({width:1894,height:907});`, then initialize the screenshot writer once with `var qaFs = await import("node:fs/promises");`. Call `await viewport.reset()` after QA.

- [ ] For every route, wait for `document.fonts.ready` and run one bounded `tab.playwright.evaluate` returning: `panel.getBoundingClientRect()`, header rect, `document.documentElement.scrollWidth-innerWidth`, `panel.scrollWidth-panel.clientWidth`, panel/header computed borders, body font family/size/weight/lineHeight/letterSpacing, header font size/weight/lineHeight, `document.fonts.check('400 14px pretendard')`, and resource names ending `.woff2`. At 1894x907 verify `#/login`, `#/apply/form`, `#/campaigns/detail`, `#/shop/RC000003200T`, `#/shop/RC000003200T/1`, `#/shop/groups`, `#/shop/groups/new`, `#/shop/groups/1/edit`, and `#/shop/groups/new/season-pick`; record panel 552±2, header 52±2, both overflows 0, header bottom border 0, and no clipped controls.

- [ ] For public/owner, use a second scoped evaluation of only the badge, handle, ME button, first group title, first two images, grid, and disclosure rect/computed styles. Record reference/local values for 32px badge, 24px/700/30px handle, 520x44px ME Space button, 168x168px product images, 16px grid gap, 18px/700/24px title, and 13px/18px disclosure; every delta must be ≤2px. With public visible run `await qaFs.writeFile("/private/tmp/selectors-ui-qa/desktop-public.png", await tab.screenshot({fullPage:true}));`; with owner visible run `await qaFs.writeFile("/private/tmp/selectors-ui-qa/desktop-owner.png", await tab.screenshot({fullPage:true}));`.

- [ ] On login/application plus one shop route, record computed body stack exactly `pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif`, body `14px/400/19.6px/-0.25px`, header `18px/500/22.5px`, `document.fonts.check('400 14px pretendard') === true`, and a same-origin hashed WOFF2 network request.

- [ ] Run `await viewport.set({width:390,height:844});`, then repeat public, owner, overview, create, edit, and campaign-create. Run the same evaluation and record panel 390px, four outer borders 0, document/panel overflow 0, two 168px columns fitting the viewport, reachable sticky action, and modal/menu focus/close behavior. With each named route visible, run exactly `await qaFs.writeFile("/private/tmp/selectors-ui-qa/mobile-public.png", await tab.screenshot({fullPage:true}));`, `await qaFs.writeFile("/private/tmp/selectors-ui-qa/mobile-owner.png", await tab.screenshot({fullPage:true}));`, and `await qaFs.writeFile("/private/tmp/selectors-ui-qa/mobile-editor.png", await tab.screenshot({fullPage:true}));` for public, owner, and `#/shop/groups/new/season-pick` respectively. Then run `test -s /private/tmp/selectors-ui-qa/desktop-public.png`, `test -s /private/tmp/selectors-ui-qa/desktop-owner.png`, `test -s /private/tmp/selectors-ui-qa/mobile-public.png`, `test -s /private/tmp/selectors-ui-qa/mobile-owner.png`, and `test -s /private/tmp/selectors-ui-qa/mobile-editor.png`; expect all five commands to exit 0.

- [ ] Exercise and record: public header share/copy/close; owner header and menu share; menu Escape/outside dismissal; blank/valid rename; delete cancel; create/edit campaign filter and save; campaign quick-add existing/new; stale-draft revisit; deletion plus both missing owner/edit states. Reload before destructive sequences so fixtures are deterministic.

- [ ] Compare public and owner captures side-by-side with the supplied/live reference. Any panel/header/product geometry difference over 2 CSS pixels, wrong type token, missing reference content, horizontal overflow, or interaction failure is a defect: add a focused failing test, patch only the responsible file, rerun the focused test, full test suite, build, and the affected browser scenario.

- [ ] Write `docs/superpowers/qa/2026-08-04-selectors-ui-fidelity.md` with a table containing route, viewport, panel/header geometry, typography, overflow, font request, interaction result, and screenshot path. Include exact commands and pass counts; do not claim unrecorded visual parity.

- [ ] Dispatch one code reviewer for reducer/routing/accessibility/regression risk and one reference-fidelity reviewer for desktop/mobile comparisons. For every Important/Critical finding, add a failing regression test, fix, rerun focused/full/build/affected browser QA, update the QA table, commit that exact owning test/component/style list, and redispatch both reviewers. Repeat until both explicitly approve with no Important/Critical findings.

- [ ] Run final `npm test -- --run`, then `npm run build`, then the exact Task 1 font/license verifier, then `git diff --check`; expect green and no diff-check output. Run `await viewport.reset()`. At this point every reviewer fix is already committed, so `git status --short` must list only the QA Markdown file.

- [ ] Commit evidence exactly with `git add docs/superpowers/qa/2026-08-04-selectors-ui-fidelity.md && git commit -m "test: verify selectors shop fidelity"`; confirm `git status --short` is empty.
