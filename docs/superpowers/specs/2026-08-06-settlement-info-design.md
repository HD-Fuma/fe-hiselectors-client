# Settlement Information Form Design

## Objective

Add a frontend-only settlement information form to the Selectors client UI. The screen lets a selector choose a settlement type and enter only the fields required for that type.

## Scope

- New route: `#/settlement/info`
- Add the screen to the catalog so it is discoverable from `#/screens`.
- Add two settlement types:
  - `사업자`: 사업자번호
  - `개인`: 은행명, 계좌번호, 예금주
- Keep the experience visual/demo-only. Save does not call an API or persist data.
- Match the existing shared panel, header, typography, spacing, and sticky action patterns.

## Screen Design

The screen uses the shared `PanelHeader` with back link to `#/screens` and title `정산 정보`.

The form contains:

1. A short intro explaining that settlement information is used for payouts.
2. A settlement-type segmented control with `사업자` and `개인`.
3. Conditional fields for the selected type.
4. A sticky bottom `저장하기` action.

The default selection is `사업자`. Switching type changes only the visible fields and preserves the entered values in the current page state. Input placeholders are explicit and labels remain visible above each field.

## Component and Route Boundaries

- Add `SettlementInfoScreen.tsx` as the route-level form component.
- Register the route in the screen registry and screen resolver.
- Reuse `PanelHeader`, `screen-scroll`, `bottom-action`, `primary-action`, and existing form field styles where possible.
- Keep settlement-history rendering in `SettlementScreen.tsx`; the new screen is an input surface, not a replacement for the existing settlement report.

## Interaction and Accessibility

- The type control uses native buttons with `aria-pressed` and a visible selected state.
- Each input has a programmatic label and an appropriate `name`.
- Save is a button with no external side effect; it may show a local `저장 정보를 저장했어요.` status message.
- No sensitive data is prefilled, stored, transmitted, or written to browser storage.
- The screen must remain usable at the existing desktop and 390px mobile breakpoints without horizontal overflow.

## Testing Strategy

- Add a failing screen-registry contract for the new route and catalog entry.
- Add a failing screen test for the default 사업자 form, conditional 개인 fields, type switching, labels, and inert save behavior.
- Add style/geometry assertions only for the shared shell contracts needed by this screen.
- Run the focused tests, full test suite, production build, and `git diff --check`.

## Acceptance Criteria

- `#/settlement/info` renders from the catalog and direct hash navigation.
- 사업자 shows only 사업자번호; 개인 shows only 은행명·계좌번호·예금주.
- Switching types is visible, accessible, and does not navigate.
- Save is present and remains frontend-only.
- Existing settlement report, login, application, campaign, and shop screens remain unchanged and green.
