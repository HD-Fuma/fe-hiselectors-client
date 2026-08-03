# Selectors Client UI fidelity QA — 2026-08-04

## Verification summary

- Desktop viewport: `1894 × 907` CSS px.
- Mobile viewport: `390 × 844` CSS px.
- Desktop panel: `554px` outer frame (`552px` content + `1px` border per side), `52px` header, zero horizontal document/panel overflow, and no header divider.
- Mobile panel: `390px`, all four outer borders `0px`, `52px` header, and zero horizontal document/panel overflow.
- Body type: `pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif`; `14px / 400 / 19.6px / -0.25px`.
- Header title: `18px / 500 / 22.5px / -0.25px`.
- Browser font check: `document.fonts.check('400 14px pretendard') === true` on every measured route.
- Development face: `/src/assets/fonts/PretendardVariable.woff2`; production face: `dist/assets/PretendardVariable-CJuje-Rk.woff2`.
- Login and application section headings render at the reference `18px`; privacy and terms sections use the measured `65px` spacing. The HiHi install mark is a fixed `29 × 29` dense QR-style matrix whose pattern uses the full borderless `110 × 110px` footprint.

## Route measurements

| Route | Viewport | Panel / header | Borders | Typography | Horizontal overflow | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `#/login` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/apply/form` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/campaigns/detail` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass; campaign commission copy absent |
| `#/shop/RC000003200T` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/shop/RC000003200T/1` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/shop/groups` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/shop/groups/new` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/shop/groups/1/edit` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| `#/shop/groups/new/season-pick` | 1894×907 | 554 outer / 52 | panel 1px, header bottom 0 | exact body/header tokens | doc 0, panel 0 | pass |
| public, owner, overview, create, edit, campaign-create | 390×844 | 390 / 52 | all panel borders 0 | exact body/header tokens | doc 0, panel 0 | pass |

## Shop reference comparison

Live reference was measured from `https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T` at the desktop viewport. Local coordinates are consistently one CSS pixel later because the requested local outer frame contributes its left/top border.

| Element | Reference | Local | Delta | Result |
| --- | --- | --- | --- | --- |
| default avatar | 74×74 | 74×74 | 0 | pass |
| influencer badge | 32×32 at x1033/y119.09 | 32×32 at x1034/y120 | ≤1 | pass |
| handle | 24px/700/30px at y163.09 | 24px/700/30px at y164 | ≤1 | pass |
| ME Space button | 520×44, gap 4, 14px/700/14px | 520×44, gap 4, 14px/700/14px | 0 | pass |
| ME Space border | `#e1e1e1` | `rgb(225, 225, 225)` | 0 | pass |
| header share icon | upload arrow + tray, 22×22 | upload arrow + tray, 22×22 | 0 | pass |
| first group title | 18px/700/24px at y301.09 | 18px/700/24px at y302 | ≤1 | pass |
| product images | 168×168 | 168×168 | 0 | pass |
| product columns | desktop x987/x1163, 168px with 8px gap | desktop x988/x1164, 168px with 8px gap | ≤1 | pass |
| product names | 13px/18px, 2-line clamp | 13px/18px, measured 36px | 0 | pass |
| product price flow | natural card flow; second price about 18px above first | first y593, second y572 | 3px | pass |
| disclosure type | 13.008px/18px | 13px/18px | 0.008px | pass |

At `390px`, the shop matches the responsive reference with three `114px` columns at x16, x138, and x260 with an `8px` gap. The available content width is `358px`; there is no horizontal overflow. Sticky editor actions measure `390×77` and remain at y767–844.

## Interaction checks

| Flow | Evidence | Result |
| --- | --- | --- |
| Application SNS selector | options are exactly Instagram, Facebook, YouTube in one uninterrupted bordered list; its white open layer fully covers the following heading instead of clipping it; OAuth label changes to `Instagram 계정 연결하기`, `Facebook 계정 연결하기`, and `YouTube 계정 연결하기` | pass |
| Public group expansion | visible groups `6 → 12 → 13`; button removed after final expansion | pass |
| Public share | sheet opens; copy status is `링크를 복사했어요.`; close restores focus to `셀렉터스샵 공유` | pass |
| Owner menu dismissal | Escape and outside pointer both close the menu; Escape restores focus to `옵션 열기` | pass |
| Owner share | menu share opens the dialog; Escape closes it and restores focus | pass |
| Rename | whitespace name exposes alert, `aria-invalid=true`, and disabled save; valid `주말의 귀걸이` persists | pass |
| Delete cancel | dialog closes, group remains, focus restores | pass |
| Create/filter/save | season campaign filters to four products; one selected product saves as `시즌 추천` and appears with one product | pass |
| Edit/save | existing jewelry group accepts a third product and returns with `상품 그룹을 수정했어요.` | pass |
| Campaign quick-add existing | one item deselected; selected three are added to `스타일 셀렉션` with deduped exact order and success status | pass |
| Campaign quick-add new | selected three seed campaign-create; Back and direct revisit show zero selected, proving one-shot draft consumption | pass |
| Campaign quick-add save | four seeded products save as a new group and return with `상품 그룹을 만들었어요.` | pass |
| Delete/missing states | deletion removes the first public group; owner and edit routes show `상품 그룹을 찾을 수 없습니다.` with no menu/editor/product controls | pass |

## Captures

- `/private/tmp/selectors-ui-qa/desktop-login.png`
- `/private/tmp/selectors-ui-qa/desktop-apply.png`
- `/private/tmp/selectors-ui-qa/desktop-public.png`
- `/private/tmp/selectors-ui-qa/desktop-public-group.png`
- `/private/tmp/selectors-ui-qa/desktop-owner.png`
- `/private/tmp/selectors-ui-qa/desktop-reference.png`
- `/private/tmp/selectors-ui-qa/mobile-login.png`
- `/private/tmp/selectors-ui-qa/mobile-public.png`
- `/private/tmp/selectors-ui-qa/mobile-owner.png`
- `/private/tmp/selectors-ui-qa/mobile-editor.png`
- `/private/tmp/selectors-ui-qa/qr-final.png`

The five required public/owner/editor captures were checked with `test -s` and are non-empty.

An independent final review of `89f7460` measured the corrected QR footprint and reported zero Critical and zero Important fidelity findings.

## Commands and outputs

```text
npm test -- --run
Test Files  14 passed (14)
Tests       121 passed (121)

npm run build
tsc -b && vite build
✓ built

node --input-type=module -e '<font/license verifier>'
verified PretendardVariable-CJuje-Rk.woff2 and dist/fonts/OFL.txt

git diff --check
(no output)
```

The UI intentionally remains a frontend-only demo: OAuth, share/copy, login, and submission controls do not call production APIs or persist to storage.
