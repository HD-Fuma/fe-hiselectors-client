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

The project will self-host a licensed Pretendard Variable WOFF2 asset instead of relying on a locally installed font or hotlinking TheHyundai assets. One `@font-face` family named `pretendard` will cover the variable weight range used by the reference.

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
- profile avatar and verification badge
- selector name `byunjjii`
- full-width `byunjjii의 ME스페이스` button
- product groups presented as titled sections
- two-column reference-style product cards with brand, name, original price, discount, and sale price
- bottom disclosure that purchase revenue may partly be provided to the selector

At most six product groups render initially. `더보기` appends the next six groups below the existing content. The button disappears when every group is visible. Loading more does not reorder or collapse prior groups.

### Owner group view

Route: `#/shop/RC000003200T/1`

The screen matches the `/1` reference:

- same shop header and share action
- group name row without the public profile block
- three-dot `옵션 열기` button
- two-column products and disclosure
- anchored menu containing `그룹 공유`, `그룹명 수정`, `항목 변경`, and `그룹 삭제`

The menu closes on outside pointer interaction or Escape and returns focus appropriately for keyboard use.

### Group rename

Choosing `그룹명 수정` opens a compact, reference-styled dialog with the current name, a 30-character limit, character count, cancel action, and save action. Empty or whitespace-only names cannot be saved. Saving updates the visible demo state for the current browser session only.

### Group items and creation

`항목 변경` and `상품 그룹 만들기` use one shared full-screen editor with two modes: edit and create. It contains:

- group-name field
- campaign filter with an `전체 캠페인` option and individual campaign choices
- two-column or list product picker using the selected campaign
- selected-product count
- save action

Changing the campaign filter only changes the available products; already selected products remain selected and are clearly represented in the count. Demo saves are local UI state and cause no network request.

### Campaign quick-add

Campaign detail includes `상품 그룹에 담기`. It opens a compact sheet that lets the selector choose an existing group or start `새 상품 그룹 만들기`. Existing-group selection shows a local success state. New-group selection routes to the shared editor with the current campaign preselected. This is a secondary shortcut; the shop remains the primary management surface.

## Component Boundaries

To keep the shop work understandable and testable, the current monolithic shop screen is split into the following units:

- `shopData`: demo selectors, campaigns, groups, and product membership
- `ShopProductGrid`: reference-style two-column products
- `ShopGroupSection`: group heading, owner action slot, and products
- `ShopGroupMenu`: accessible three-dot menu
- `RenameGroupDialog`: validation and rename state
- `GroupEditorScreen`: shared create/edit editor and campaign filtering
- `PublicShopScreen` and `OwnerShopGroupScreen`: route-level composition only

Shared shell and typography remain in the existing global token/style layer. Campaign quick-add stays with campaign screens but consumes the same shop group data shape.

## Interaction and Accessibility Requirements

- Buttons and menus use native controls and descriptive accessible names.
- The three-dot control exposes expanded state and menu ownership.
- Menu items support keyboard navigation, Escape dismissal, and focus restoration.
- Dialog and sheet titles are programmatically associated with their containers.
- Rename validation is visible and announced without relying on color alone.
- `더보기` preserves scroll position and appends content in document order.
- All UI remains usable at 390x844 without horizontal overflow.

## Testing Strategy

Implementation follows red-green-refactor cycles.

1. Add failing shell and typography contracts for the single outer frame, absent header divider, local variable font, baseline spacing, and supported weight tokens.
2. Add a failing campaign contract proving campaign-specific commission copy is absent while performance/settlement commission reporting remains.
3. Add failing shop route and reference-content tests for both public and `/1` screens.
4. Add failing interaction tests for six-at-a-time loading, the owner menu, rename validation/save, campaign filtering, create/edit modes, and campaign quick-add.
5. Run the full unit suite, TypeScript/Vite production build, and `git diff --check`.
6. Perform desktop and 390px browser QA against the supplied/live references, including computed typography and horizontal overflow checks.

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
