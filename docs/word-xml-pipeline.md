# Word XML Pipeline

The BUILD action produces a `.docx` by directly manipulating Word's underlying XML.

## Why direct XML?

Libraries like python-docx abstract the XML but make it hard to implement:
- Outline-level headings with document-local style overrides
- Hidden text (`<w:vanish/>`) provenance annotations
- Tracked changes (`<w:ins/>`, `<w:del/>`)
- Per-run language tags (`de-CH`, `en-GB`)

Direct XML gives full control over all of these.

## The round-trip

```
1. Download .docx from SharePoint (Graph API temp download URL)
2. Unzip — .docx is a ZIP containing:
   - word/document.xml   ← main content  ← edit here
   - word/styles.xml     ← style definitions
   - word/settings.xml   ← document settings (language etc.)
   - [Content_Types].xml, _rels/, etc.
3. Edit word/document.xml
4. Rezip preserving all other files
5. Upload to SharePoint via Graph upload session (PUT with Content-Range header)
```

## Paragraph structure — CRITICAL

Each block of content MUST use `<w:p>` paragraph elements, NOT `<w:br/>` line breaks.

```xml
<!-- ✅ Correct — produces ^p paragraph marks in Word -->
<w:p>
  <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
  <w:r><w:t>Block content here.</w:t></w:r>
</w:p>

<!-- ❌ Wrong — produces ^l line breaks, breaks styles, Outline view, tracked changes -->
<w:r><w:t>Block content.</w:t><w:br/></w:r>
```

When converting OneNote HTML to Word XML, each `<p>` tag in the HTML must produce a new `<w:p>` element.

**Note:** OneNote page content via Graph API returns HTML. Text is often split across multiple XML runs — simple string search for a word may fail because the characters span multiple `<w:r>` elements. Search for partial strings to locate runs reliably.

## Block heading structure

Each block is preceded by a neutral Heading 1 enabling Word Outline view drag-reorder:

```xml
<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
    <w:rPr>
      <w:color w:val="808080"/>  <!-- grey -->
      <w:sz w:val="20"/>         <!-- 10pt -->
      <w:b w:val="0"/>           <!-- not bold -->
    </w:rPr>
  </w:pPr>
  <w:r><w:t>Block Name Here</w:t></w:r>
</w:p>
```

Style is applied document-local — does not affect the user's global Word template.

## Hidden provenance

Visible in Word via Ctrl+Shift+8 (show formatting marks):

```xml
<w:p>
  <w:r>
    <w:rPr><w:vanish/></w:rPr>
    <w:t>[Source: Section → Page | Modified: 2026-04-18 | Built: 2026-04-18]</w:t>
  </w:r>
</w:p>
```

## Language tagging

```xml
<!-- British English default -->
<w:r>
  <w:rPr><w:lang w:val="en-GB"/></w:rPr>
  <w:t>Content in English.</w:t>
</w:r>

<!-- Swiss German for German passages -->
<w:r>
  <w:rPr><w:lang w:val="de-CH"/></w:rPr>
  <w:t>Inhalt auf Deutsch.</w:t>
</w:r>
```

Apply `en-GB` as default to `settings.xml` and `styles.xml` on every round-trip.

## SharePoint upload

```python
# 1. Create upload session
session = graph.post(
    f"/drives/{drive_id}/items/{item_id}/createUploadSession",
    json={"item": {"@microsoft.graph.conflictBehavior": "replace"}}
)
upload_url = session["uploadUrl"]

# 2. PUT file bytes with Content-Range
with open("document.docx", "rb") as f:
    data = f.read()
requests.put(
    upload_url,
    data=data,
    headers={"Content-Range": f"bytes 0-{len(data)-1}/{len(data)}"}
)
```
