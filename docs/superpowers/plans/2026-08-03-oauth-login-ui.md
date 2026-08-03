# OAuth Login UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the application URL/ID field with a three-provider OAuth selector and rebuild the login route to match the supplied The Hyundai Hi login reference.

**Architecture:** Keep both routes in the existing hash registry. The application selector uses local React state and an accessible button/listbox; the login route uses local password-visibility state. All actions remain inert with no auth SDK, API, navigation, storage, or validation.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library `fireEvent`

---

## Chunk 1: Application SNS OAuth selector

### Task 1: Selector RED → GREEN

**Files:**
- Modify: `src/screens/applyReference.test.tsx`
- Modify: `src/screens/ApplyScreens.tsx`
- Modify: `src/components/Icons.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write failing structure/state tests**

Add focused tests that render `#/apply/form` and assert:

```tsx
const trigger = screen.getByRole('button', { name: '대표 SNS 선택' })
expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
expect(trigger.getAttribute('aria-expanded')).toBe('false')
expect(trigger.getAttribute('aria-controls')).toBe('representative-sns-options')
expect(screen.getByRole('button', { name: 'SNS 계정 연결하기' })).toHaveProperty('disabled', true)
expect(screen.queryByPlaceholderText('URL 주소 입력')).toBeNull()

fireEvent.click(trigger)
const options = within(screen.getByRole('listbox', { name: '대표 SNS' })).getAllByRole('option')
expect(options.map((option) => option.textContent)).toEqual(['인스타그램', '페이스북', '유튜브'])
expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'false', 'false'])
```

Select each option in turn and assert the same OAuth button becomes enabled with `Instagram 계정 연결하기`, `Facebook 계정 연결하기`, and `YouTube 계정 연결하기`. Assert the trigger closes and shows the selected Korean label. Assert helper/privacy copy uses `연결해주세요` and `SNS 계정 연결 정보`.

- [ ] **Step 2: Write failing keyboard/inert tests**

Use `fireEvent.keyDown` in separate closed-state cases to assert Enter, Space, and ArrowDown open and focus the first option while ArrowUp opens and focuses the last option. In the open list assert ArrowDown/ArrowUp moves option focus, Enter selects and returns focus to the trigger, the selected option reports `aria-selected="true"`, and Escape closes and returns focus to the trigger. Assert the OAuth control has `type="button"`; clicking it leaves `window.location.hash` unchanged.

- [ ] **Step 3: Verify RED**

Run:

```bash
PATH=/Users/leeyukyung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm test -- --run src/screens/applyReference.test.tsx
```

Expected: FAIL because the current native select/URL field does not provide the trigger, listbox, disabled OAuth button, new copy, or keyboard behavior.

- [ ] **Step 4: Implement minimal selector**

In `ApplyScreens.tsx`, add a provider table and local state:

```tsx
const snsProviders = [
  { id: 'instagram', label: '인스타그램', oauthLabel: 'Instagram 계정 연결하기' },
  { id: 'facebook', label: '페이스북', oauthLabel: 'Facebook 계정 연결하기' },
  { id: 'youtube', label: '유튜브', oauthLabel: 'YouTube 계정 연결하기' },
] as const
```

Use a ref for the trigger and option refs for predictable keyboard focus. Render a `button` trigger, conditional `role="listbox"`, three `button role="option"` controls, and one OAuth button. Add provider glyphs to `Icons.tsx`. In CSS preserve the 552px panel, 16px insets, 52px trigger/OAuth height, 44px menu rows, square 1px borders, and a positioned menu that overlays lower content.

- [ ] **Step 5: Verify GREEN**

Run the Step 3 command. Expected: all `applyReference` tests pass.

- [ ] **Step 6: Commit selector slice**

```bash
git add src/screens/applyReference.test.tsx src/screens/ApplyScreens.tsx src/components/Icons.tsx src/styles/global.css
git commit -m "feat: add selectors OAuth channel picker"
```

## Chunk 2: The Hyundai reference login

### Task 2: Login RED → GREEN

**Files:**
- Create: `src/screens/loginReference.test.tsx`
- Modify: `src/screens/screens.test.tsx`
- Modify: `src/screens/LoginScreen.tsx`
- Modify: `src/components/Icons.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write failing reference-order tests**

Render `#/login`. Assert labelled `아이디` and `비밀번호` fields, password type, `아이디 저장` and `자동 로그인` checkboxes, black primary `로그인`, its `최근에 로그인 했어요.` badge, `통합회원 가입하기`, `아이디/비밀번호 찾기`, sections `BIZ회원 로그인` and `통합회원 전환`, and exact section CTAs `BIZ회원 로그인 페이지로` and `통합회원 전환하기`.

Within an `aria-label="간편 로그인"` group, assert exact button order:

```tsx
expect(within(methods).getAllByRole('button').map((button) => button.textContent?.trim())).toEqual([
  '휴대폰 인증 로그인',
  '네이버 로그인',
  '카카오 로그인',
  '토스 로그인',
  'QR 코드 로그인',
  'H.Point APP 로그인',
])
```

Update the route smoke expectation from the old marketing sentence to `H.Point 통합회원 로그인`.

- [ ] **Step 2: Write failing behavior/inert tests**

Click `비밀번호 보기`, assert input becomes `type="text"` and the name becomes `비밀번호 숨기기`; click again and assert `password`. Assert both checks are native checkbox inputs. Assert alternative/BIZ/conversion controls are `type="button"`. Submit the login form and click each inert button, confirming the hash remains `#/login`.

- [ ] **Step 3: Verify RED**

Run:

```bash
PATH=/Users/leeyukyung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm test -- --run src/screens/loginReference.test.tsx src/screens/screens.test.tsx
```

Expected: FAIL because the current marketing login lacks the H.Point hierarchy, visibility control, checks, six methods, BIZ, and conversion sections.

- [ ] **Step 4: Implement minimal login reference**

Replace `LoginScreen.tsx` with the ordered reference structure. Use local state only for password visibility. Add accessible labels and state-dependent toggle names. Render the six methods from a fixed ordered array, with black provider glyphs and `type="button"`. Add the recent-login green badge, BIZ section, and conversion section. Every form submits through `preventDefault` and every non-submit action is a button.

CSS acceptance criteria:

- 552px panel and 16px horizontal inset
- 24px top content inset
- 52px inputs and primary action with 8px input gap
- 44px alternate actions with 8px gaps
- square 1px borders, black/white palette, 16–18px section headings
- vertical scroll at 390px with no horizontal overflow

- [ ] **Step 5: Verify GREEN**

Run the Step 3 command. Expected: all login and route tests pass.

- [ ] **Step 6: Commit login slice**

```bash
git add src/screens/loginReference.test.tsx src/screens/screens.test.tsx src/screens/LoginScreen.tsx src/components/Icons.tsx src/styles/global.css
git commit -m "feat: match the Hyundai login reference"
```

## Chunk 3: Integration verification

### Task 3: Full verification and browser QA

**Files:**
- Test: `src/screens/applyReference.test.tsx`
- Test: `src/screens/loginReference.test.tsx`
- Test: `src/screens/screens.test.tsx`

- [ ] Run `PATH=/Users/leeyukyung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm test -- --run`; expected: zero failures.
- [ ] Run `PATH=/Users/leeyukyung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build`; expected: successful Vite production build.
- [ ] Start/reuse `npm run dev` and inspect `http://127.0.0.1:4173/#/login` plus `http://127.0.0.1:4173/#/apply/form` at 1894×963 and 390×844.
- [ ] Capture the application menu closed, open, and selected states. Compare login hierarchy, button order, 16px insets, control heights, square borders, and section spacing to the supplied screenshots.
- [ ] On both routes/viewports evaluate `document.documentElement.scrollWidth <= window.innerWidth`; expected: `true`.
- [ ] Run `git diff --check`; expected: no output.
