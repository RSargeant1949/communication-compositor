# Roadmap

The compositor UI (v4) is functional. The following layers need building for production use.

---

## 🔴 High priority

### 1. Word XML — `^p` paragraph fix
Current pipeline emits `<w:br/>` line breaks instead of `<w:p>` paragraph elements. Each OneNote `<p>` tag must map to a distinct `<w:p>` in `document.xml`. Fix before any document rebuild — affects styles, Outline view, and tracked changes.

### 2. Graph API — live block fetch
Replace mock data with live Microsoft Graph API calls:
- `GET /me/onenote/notebooks/{id}/sections` → section list
- `GET /me/onenote/sections/{id}/pages` → pages per section
- `GET /me/onenote/pages/{id}/content` → HTML content for snippets
- **Lazy-load rule:** count pages first; if ≤20 fetch all snippets upfront; if >20 lazy-load as cards render

### 3. Prompt parser
Parse natural language prompt into section fetch list:
```
using blocks from both and Gabriela - work to Gabriela Health and Richard*
```
- Fuzzy match section names (case-insensitive, partial)
- Range support: `A to B` resolved against notebook section order
- Wildcard: `Richard*` matches all `Blocks - Richard - *` sections
- Confirmation step before fetch: "Matched X, Y, Z — correct?"

---

## 🟡 Medium priority

### 4. Outline headings in Word output
Each block preceded by neutral Heading 1 (Calibri 10pt, grey #808080, not bold) enabling Word Outline view drag-reorder. Style applied document-local only.

### 5. Hidden text provenance
```xml
<w:r><w:rPr><w:vanish/></w:rPr>
  <w:t>[Source: Section → Page | Modified: DATE | Built: DATE]</w:t>
</w:r>
```
Visible in Word via Ctrl+Shift+8.

### 6. Tracked changes
All edits embedded as `<w:ins/>`/`<w:del/>` in Word XML — accept/reject in review pane.

### 7. Language defaults
Apply `en-GB` to `settings.xml` and `styles.xml` on every round-trip. German passages tagged `de-CH` per-run.

### 8. OneNote notebook selector
Allow selection of which OneNote notebook feeds the compositor. Currently hardcoded.

---

## 🟢 Nice to have

### 9. Save composition state
Save current block order + recipient + ticks as a named draft.

### 10. Block editor
Edit block content inline, write changes back to OneNote.

### 11. Send directly
After BUILD, send document as email attachment via Graph API.

### 12. Mobile layout
Compositor is desktop-first. Responsive layout for tablet.

---

## ✅ Done (v4)

- [x] Compositor UI — grouped sections, drag/tick/reorder, undo, BUILD/CANCEL/Settings
- [x] Light/dark mode (light default)
- [x] Recipient selector with email radio buttons and omission rules
- [x] Granular undo/redo stack (Ctrl+Z/Y), covers every action
- [x] Section drag as unit (expanded or collapsed)
- [x] Block drag across sections
- [x] ↑↓ arrow buttons per block and per section
- [x] Lazy snippet loading trigger (>20 pages)
- [x] CANCEL guard (detects unsaved changes)
- [x] Settings panel — recipient management, dark/light toggle, notebook selector placeholder
