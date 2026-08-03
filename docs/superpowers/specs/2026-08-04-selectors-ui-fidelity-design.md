# Selectors UI Fidelity and Shop Management Design

## Objective

Bring the existing React and TypeScript client UI into visual alignment with the supplied TheHyundai Hi references while incorporating every follow-up requirement from the user. The result remains a client-side demonstration: controls expose the requested states and transitions, but no backend persistence, OAuth exchange, checkout, or external mutation is introduced.

## Scope

This change covers four connected areas:

1. Correct the shared panel border and header divider.
2. Match TheHyundai Hi typography consistently across every screen.
3. Remove the campaign-specific activity commission claim.
4. Rebuild the public and owner Selectors Shop screens and their product-group management states.

Existing OAuth selection and login UI remain in scope for regression and typography checks, but their approved flows do not change.

## Reference Sources

- Public Selectors Shop: `https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T`
- Owner product-group view: `https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T/1`
- Existing supplied login and application screenshots

The public reference establishes the profile, ME Space button, product-group sections, two-column product cards, disclosure copy, header sizing, and share action. The `/1` reference establishes the owner group title row, three-dot menu, two-column product cards, and the menu labels `그룹 공유`, `그룹명 수정`, `항목 변경`, and `그룹 삭제`.

## Shared Shell and Border Model

The 552px client panel owns one quiet outer frame. On desktop, it uses a single 1px `--line` perimeter rather than two inset side shadows. The header is part of that frame and does not draw its own bottom border. This removes the extra horizontal line beneath the back button while retaining the visual boundary around the complete UI.

The sticky bottom action may retain its top separator because it is a distinct action area in the supplied references. At mobile widths, the panel becomes full-bleed and the outer frame is removed so it does not create a double edge against the viewport.

## Typography System

The project will self-host a licensed Pretendard Variable WOFF2 asset instead of relying on a locally installed font or hotlinking TheHyundai assets. The font is stored at `src/assets/fonts/PretendardVariable.woff2`, while its Open Font License text is copied from `public/fonts/OFL.txt` into the production build. One `@font-face` family named `pretendard` declares `font-style: normal`, `font-weight: 45 920`, and `font-display: swap`.

Global typography baseline:

- `font-family: pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif`
- `font-size: 14px`
- `font-weight: 400`
- `line-height: 1.4`
- `letter-spacing: -0.25px`
- `-webkit-font-smoothing: antialiased`

Reference-facing type tokens use only 400, 500, 600, and 700. Existing synthetic 750 and 800 values are replaced with the closest reference token. Shared headers become 18px/500 with a 22.5px line height. Screen-specific titles, body copy, buttons, and the HiHi aside are calibrated from computed reference styles rather than inheriting the previous generic values. Intentional logo artwork and icon geometry are not affected.

## Campaign Detail

The `활동 수수료 / 상품별 최대 8%` row is removed from the campaign detail screen. Campaigns do not claim a distinct commission rate. Performance and settlement screens keep their actual aggregate and product-level commission amounts because those are reporting values, not campaign-specific rates.

The remaining campaign period row expands naturally without leaving an empty second slot or divider.

## Selectors Shop Information Architecture

### Public shop

Route: `#/shop/RC000003200T`

The screen matches the public reference:

- 52px header with back and share actions
- exact 32px influencer-badge graphic used by the live page as its profile visual; the reference exposes no separate portrait avatar
- selector name `byunjjii`
- full-width `byunjjii의 ME스페이스` button
- product groups presented as titled sections
- two-column reference-style product cards with brand, name, original price, discount, and sale price
- bottom disclosure that purchase revenue may partly be provided to the selector

The header share action opens the same UI-only share sheet pattern used by groups, but with the public shop URL and the title `셀렉터스샵 공유`. Its `링크 복사` action shows `링크를 복사했어요.` without invoking a clipboard or share API.

The demo fixture contains 13 product groups so the delivered UI exercises both a full and a partial expansion. At most six product groups render initially. Each `더보기` click appends the next six groups below the existing content: 6, then 12, then 13. The button disappears when every group is visible. Loading more does not reorder or collapse prior groups.

### Owner group view

Route: `#/shop/RC000003200T/1`

The screen matches the `/1` reference:

- same shop header and share action
- group name row without the public profile block
- three-dot `옵션 열기` button
- two-column products and disclosure
- anchored menu containing `그룹 공유`, `그룹명 수정`, `항목 변경`, and `그룹 삭제`

The menu closes on outside pointer interaction or Escape and returns focus appropriately for keyboard use.

The owner group header share action and the menu's `그룹 공유` item both open one shared `상품 그룹 공유` sheet containing the group URL. This prevents the two share entry points from drifting into different behaviors.

`그룹 공유` opens a bottom sheet containing the group URL and a `링크 복사` action. Because this is a UI-only demo, pressing it only shows the local status `링크를 복사했어요.` and does not invoke a share or clipboard API.

`그룹 삭제` opens a confirmation dialog naming the group. Cancel closes the dialog. Confirm removes the group from in-memory demo state, routes to the public shop, and shows `상품 그룹을 삭제했어요.` No backend request is made.

### Group rename

Choosing `그룹명 수정` opens a compact, reference-styled dialog with the current name, a 30-character limit, character count, cancel action, and save action. Names are trimmed before validation, must contain 1–30 characters, and show an inline error when invalid. Saving updates the visible in-memory demo state and closes the dialog.

### Group items and creation

`항목 변경` and `상품 그룹 만들기` use one shared full-screen editor with two modes: edit and create. The exact hash routes are:

- `#/shop/groups/new`: empty create mode launched from the shop
- `#/shop/groups/1/edit`: edit group `1`, prepopulated from demo state
- `#/shop/groups/new/season-pick`: create mode launched from campaign detail with `season-pick` selected and the quick-add product IDs carried in in-memory draft state

The existing `#/shop/groups` route remains an owner management overview backed by the same `ShopDemoProvider`. It lists the current group summaries, links group `1` to the reference-style owner route, and owns the sticky `상품 그룹 만들기` control that launches `#/shop/groups/new`. The screen catalog continues to link to this overview. The old `#/shop/groups/edit` route redirects to `#/shop/groups/new` for backward compatibility. The shared editor contains:

- group-name field
- campaign filter with an `전체 캠페인` option and individual campaign choices
- two-column or list product picker using the selected campaign
- selected-product count
- save action

Changing the campaign filter only changes the available products; already selected products remain selected and are clearly represented in the count. An empty filter result renders `이 캠페인에서 선택할 수 있는 상품이 없습니다.` rather than a blank area.

The name uses the same trimmed 1–30 character rule as rename. At least one product is required. Save remains disabled until both rules pass. Edit mode prepopulates the current group name, campaign context, and product membership. Create mode starts with an empty name and no products unless quick-add draft state supplies product IDs. Saving edit mode updates the in-memory group and routes to `#/shop/RC000003200T/1`. Saving create mode appends the group and routes to `#/shop/RC000003200T`, where `상품 그룹을 만들었어요.` is shown. Back returns to the owner group for edit mode, `#/shop/groups` for owner-overview-launched create mode, and campaign detail for campaign-launched create mode.

If a requested group no longer exists, both its owner view and edit route render the shared shop header, `상품 그룹을 찾을 수 없습니다.`, and `셀렉터스샵으로 돌아가기`, which routes to the public shop. They never reuse stale fixture content or throw.

### Campaign quick-add

Campaign detail includes `상품 그룹에 담기`. It opens a compact sheet containing the four visible campaign products with checkboxes, all selected initially, followed by the existing groups and `새 상품 그룹 만들기`. At least one product must remain selected.

Choosing an existing group adds the selected product IDs to that group in memory, deduplicates products already present, closes the sheet, and shows `상품을 그룹에 담았어요.` Choosing `새 상품 그룹 만들기` stores the selected product IDs as an in-memory draft and routes to `#/shop/groups/new/season-pick`, where the current campaign is preselected. The editor copies the draft into local form state on first mount and immediately clears it from the provider. Back/cancel and save also call `clearQuickAddDraft` defensively, so revisiting the route cannot replay old selections. This is a secondary shortcut; the shop remains the primary management surface.

## Demo State Ownership and Lifetime

One `ShopDemoProvider` wraps the routed application and owns a reducer-backed `ShopDemoState`. It initializes the selector profile, campaigns, 13 groups, group membership, transient status message, and optional quick-add draft. Its public actions are `renameGroup`, `updateGroupProducts`, `createGroup`, `addProductsToGroup`, `deleteGroup`, `setQuickAddDraft`, `clearQuickAddDraft`, and `setStatus`.

All shop and campaign route components consume this interface instead of owning duplicate data. State survives hash-route navigation within the current SPA instance. A full browser reload restores the original fixtures; no local storage, session storage, cookie, URL serialization, or backend persistence is used. Tests mount a fresh provider per case.

## Component Boundaries

To keep the shop work understandable and testable, the current monolithic shop screen is split into the following units:

- `shopData`: demo selectors, campaigns, groups, and product membership
- `ShopProductGrid`: reference-style two-column products
- `ShopGroupSection`: group heading, owner action slot, and products
- `ShopGroupMenu`: accessible three-dot menu
- `ShareShopSheet`: shared public-shop and product-group share presentation
- `RenameGroupDialog`: validation and rename state
- `GroupEditorScreen`: shared create/edit editor and campaign filtering
- `PublicShopScreen`, `OwnerShopGroupScreen`, and `ShopGroupsScreen`: route-level composition only; the last retains the owner overview and its create entry point
- `ShopDemoProvider`: the sole in-memory state owner and mutation interface

Shared shell and typography remain in the existing global token/style layer. Campaign quick-add stays with campaign screens but consumes the same shop group data shape.

## Interaction and Accessibility Requirements

- Buttons and menus use native controls and descriptive accessible names.
- The three-dot control exposes expanded state and menu ownership.
- Menu items support keyboard navigation, Escape dismissal, and focus restoration.
- Dialog and sheet titles are programmatically associated with their containers.
- Dialogs and sheets contain keyboard focus while open, close on Escape where cancellation is safe, and restore focus to the invoking control.
- Rename validation is visible and announced without relying on color alone.
- `더보기` preserves scroll position and appends content in document order.
- All UI remains usable at 390x844 without horizontal overflow.

## Testing Strategy

Implementation follows red-green-refactor cycles.

1. Add failing shell and typography contracts for the single outer frame, absent header divider, local variable font, baseline spacing, and supported weight tokens.
2. Add a failing campaign contract proving campaign-specific commission copy is absent while performance/settlement commission reporting remains.
3. Add failing shop route and reference-content tests for both public and `/1` screens.
4. Add failing interaction tests for six-at-a-time loading, the owner menu, header/menu sharing, rename validation/save, deletion and missing-group routes, the legacy owner overview, campaign filtering, create/edit modes, quick-add, and draft clearing.
5. Add provider reducer tests proving route-to-route state continuity and full-remount reset semantics.
6. Run the full unit suite, TypeScript/Vite production build, and `git diff --check`.
7. Perform Chromium/in-app-browser QA at 1894x907 and 390x844 against the supplied/live references. Key panel/header/product geometry must be within 2 CSS pixels of measured reference values, computed typography must match the specified tokens exactly, and both document and panel horizontal overflow must be zero.
8. Wait for `document.fonts.ready`, assert `document.fonts.check('400 14px pretendard')`, verify the built page requests its own hashed WOFF2 asset, and confirm the build output contains both the font and license.

## Out of Scope

- Backend persistence or database models
- Real sharing, deletion, OAuth, checkout, or group mutation APIs
- Product search beyond the requested campaign filter
- Replacing the existing application and login flows
- Hotlinking private or build-specific font files from TheHyundai

## Acceptance Criteria

- The panel has one outer frame and no line under the shared header.
- Pretendard Variable and the reference baseline typography render consistently without depending on a local system font.
- No campaign screen claims a campaign-specific activity commission rate.
- Public and owner shop routes visually match their supplied references.
- Public shop initially shows six groups and expands by six until complete.
- A selector can expose the owner menu, rename a group, enter item editing, and start a group with campaign-filtered products.
- Campaign detail offers the approved quick-add path into a product group.
- Existing login and OAuth contracts remain green.
- Full tests, build, desktop QA, and mobile QA pass without horizontal overflow.
