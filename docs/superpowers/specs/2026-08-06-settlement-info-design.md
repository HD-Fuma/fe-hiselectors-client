# Settlement Information Form Design

## Objective

Add a frontend-only settlement information form to the Selectors client UI. The screen lets a selector choose a settlement type and enter only the fields required for that type.

## Scope

- New route: `#/settlement/info` with registry id `settlement-info`.
- Add the screen to the catalog so it is discoverable from `#/screens`.
- Add two settlement types:
  - `사업자`: 사업자번호
  - `개인`: 은행명, 계좌번호, 예금주
- Keep the experience visual/demo-only. Save does not call an API or persist data.
- Match the existing shared panel, header, typography, spacing, and sticky action patterns.

## Screen Design

The screen uses the shared `PanelHeader` with back link to `#/screens` and title `정산 정보`.

Register `settlement-info` in `src/screenRegistry.ts` immediately after the existing settlement-history entry, add its exhaustive `catalogMeta` copy (`정산 정보`, `정산 유형과 지급 정보를 입력`), and map the id in the exhaustive `getScreenComponent` record in `src/screens/index.tsx`. Update registry/catalog count and route contract tests for the new item.

The form contains:

1. A short intro explaining that settlement information is used for payouts.
2. A settlement-type segmented control with `사업자` and `개인`.
3. Conditional fields for the selected type.
4. A sticky bottom `저장하기` action rendered as the sibling of `.screen-scroll` inside the existing `.panel-page` flex shell, so it remains visible while the form scrolls.

The default selection is `사업자`. Switching type changes only the visible fields and preserves the entered values in the current page state. Input placeholders are explicit and labels remain visible above each field.

## Component and Route Boundaries

- Add `SettlementInfoScreen.tsx` as the route-level form component.
- Register the route in the screen registry and screen resolver.
- Reuse `PanelHeader`, `screen-scroll`, `bottom-action`, `primary-action`, and existing form field styles where possible.
- Keep settlement-history rendering in `SettlementScreen.tsx`; the new screen is an input surface, not a replacement for the existing settlement report.

## Interaction and Accessibility

- The type control is a `fieldset` with legend `정산 유형` and native buttons with `aria-pressed`, visible selected/focus-visible states.
- Fields are linked with `label htmlFor`, have stable ids/names and are required: business `businessNumber` (`type=text`, `inputMode=numeric`, `autoComplete=off`, maxLength 12); personal `bankName` (`type=text`, `autoComplete=organization`), `accountNumber` (`type=text`, `inputMode=numeric`, `autoComplete=off`, maxLength 20), and `accountHolder` (`type=text`, `autoComplete=name`). Unselected type fields are absent from the DOM, not merely visually hidden; values remain in local React state when switching.
- Save uses `type=button` with deterministic local behavior: native `required` attributes are intentional semantic metadata only (there is no validation gate in this visual-only screen); clicking it sets `role=status`/`aria-live=polite` text to exactly `정산 정보를 저장했어요.` regardless of field completeness. Tests must cover the empty-field click and status result.
- No sensitive data is prefilled, transmitted, persisted, or written to browser storage; entered values exist only in transient React state for the current screen and are discarded on unmount.
- The screen must remain usable at the existing desktop and 390px mobile breakpoints without horizontal overflow.

## Testing Strategy

- Add a failing screen-registry contract for the new route and catalog entry.
- Add a failing screen test for the default 사업자 form, conditional 개인 fields, type switching, values preserved across switching, linked labels, deterministic status, and no fetch/storage side effects.
- Add style/geometry assertions for the `.panel-page` + `.screen-scroll` + `.bottom-action` shell and no horizontal overflow at desktop/mobile widths.
- Run the focused tests, full test suite, production build, and `git diff --check`.

## Acceptance Criteria

- `#/settlement/info` renders from the catalog and direct hash navigation.
- 사업자 shows only 사업자번호; 개인 shows only 은행명·계좌번호·예금주.
- Switching types is visible, accessible, and does not navigate.
- Save is present and remains frontend-only.
- Save always shows the local status copy without validation/navigation side effects.
- Existing settlement report, login, application, campaign, and shop screens remain unchanged and green.
