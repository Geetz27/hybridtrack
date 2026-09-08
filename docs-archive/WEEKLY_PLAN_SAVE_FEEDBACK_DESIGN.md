# Save Failure Handling — Simplest Solution Design

> Minimal design for user-visible save success/failure feedback in the Weekly Plan editor.
>
> **Constraint:** No third-party libraries. Minimal UI changes. Reuse existing patterns.

---

## 1. Design Decision: Reuse Existing Toast Pattern

The app already has a working toast notification system:

```jsx
// Existing pattern in App.jsx:
const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState('');

// Usage:
setToastMessage("Data tersimpan di Cloud!");
setShowToast(true);
setTimeout(() => setShowToast(false), 3000);
```

**Decision:** Reuse this exact pattern. No new components, no new state management, no new UI.

---

## 2. What Changes

### 2.1. Add `toastMessage` state to `WeeklyPlanTab`

The existing toast in `App.jsx` uses `showToast` (boolean) but the message is hardcoded to `"Data tersimpan di Cloud!"`. We need a dynamic message.

**Minimal change:** Add two state variables inside `WeeklyPlanTab`:

```javascript
const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
```

### 2.2. Modify `saveDraft()` to update status

```javascript
const saveDraft = async () => {
  setSaveStatus('saving');
  
  const updatedPlan = {
    ...weeklyPlan,
    days: { ...weeklyPlan.days, [editingDay]: editDraft }
  };
  setWeeklyPlan(updatedPlan);
  setEditingDay(null);
  setEditDraft(null);

  if (user) {
    try {
      const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
      await setDoc(planDocRef, {
        ...updatedPlan,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaveStatus('saved');
    } catch (err) {
      console.error("Error saving plan:", err);
      setSaveStatus('error');
    }
  } else {
    setSaveStatus('saved'); // no user = local-only save
  }

  // Auto-clear after 3 seconds
  setTimeout(() => setSaveStatus(null), 3000);
};
```

### 2.3. Add inline status indicator in the edit modal header

The edit modal already has a header with the day name and a "Simpan" button. Add a small status text next to the Save button:

```jsx
// Inside the edit modal header, next to the Save button:
{saveStatus === 'saving' && (
  <span className="text-[10px] text-[#64748B] font-bold animate-pulse">
    Menyimpan...
  </span>
)}
{saveStatus === 'saved' && (
  <span className="text-[10px] text-[#14B8A6] font-bold">
    ✓ Tersimpan
  </span>
)}
{saveStatus === 'error' && (
  <span className="text-[10px] text-[#d07573] font-bold">
    ✗ Gagal menyimpan
  </span>
)}
```

### 2.4. Disable Save button while saving

Prevent double-clicks:

```jsx
<button 
  onClick={saveDraft} 
  disabled={saveStatus === 'saving'}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  Simpan
</button>
```

---

## 3. Visual Design

### Success State

```
┌─────────────────────────────────────────────┐
│  Edit Senin — Push A          ✓ Tersimpan   │
│                                              │
│  [exercise fields...]                        │
│                                              │
│  [Batal]  [Simpan]                           │
└─────────────────────────────────────────────┘
```

- Green checkmark + "Tersimpan" text in `text-[#14B8A6]`
- Auto-clears after 3 seconds

### Error State

```
┌─────────────────────────────────────────────┐
│  Edit Senin — Push A          ✗ Gagal       │
│                                              │
│  [exercise fields...]                        │
│                                              │
│  [Batal]  [Simpan]                           │
└─────────────────────────────────────────────┘
```

- Red X + "Gagal menyimpan" text in `text-[#d07573]`
- Does NOT auto-clear (user must dismiss by clicking Save again or closing the modal)
- The edit is still in `editDraft` state — user can retry

### Saving State

```
┌─────────────────────────────────────────────┐
│  Edit Senin — Push A          Menyimpan...  │
│                                              │
│  [exercise fields...]                        │
│                                              │
│  [Batal]  [Simpan (disabled)]                │
└─────────────────────────────────────────────┘
```

- Gray pulsing text in `text-[#64748B]`
- Save button disabled to prevent double-click

---

## 4. State Machine

```
null ──(click Save)──→ saving ──(success)──→ saved ──(3s timeout)──→ null
                          │
                          └──(error)──→ error ──(click Save again)──→ saving
```

- `null`: No status shown (default)
- `saving`: Show "Menyimpan...", disable Save button
- `saved`: Show "✓ Tersimpan", auto-clear after 3s
- `error`: Show "✗ Gagal menyimpan", stays until user retries

---

## 5. Files Changed

| File | Change |
|------|--------|
| `src/App.jsx` — `WeeklyPlanTab` component | Add `saveStatus` state, modify `saveDraft()`, add inline status indicator, disable Save button while saving |

**No other files need changes.** No new components. No new imports. No third-party libraries.

---

## 6. Comparison with Alternatives

| Approach | Complexity | User Experience | Code Changes |
|----------|-----------|-----------------|--------------|
| **Inline status text** (chosen) | ★☆☆ | Good — immediate feedback in context | ~15 lines |
| Toast notification (reuse existing) | ★☆☆ | Good — visible but separate from edit area | ~10 lines + needs toast state in parent |
| Modal dialog | ★★★ | Disruptive — blocks editing | ~40 lines |
| Console only (current) | ☆☆☆ | None — user sees nothing | 0 lines |

**Why inline status text over toast:**
- The edit modal is already a focused editing context. Status text inside it is more relevant than a toast that appears elsewhere.
- No need to lift state up to `App.jsx` for toast management.
- The user can see the status while still viewing their edits.

---

*Generated: June 23, 2026 | Project: HybridTrack*
