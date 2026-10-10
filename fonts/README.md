# Fonts

The two licensed fonts are not bundled. To add them:

1. Put the web font files in this folder:
   - `TTHovesPro-ExpandedMedium.woff2` (TT Hoves Pro Expanded, weight 500, used for headers, nav and labels)
   - `Tercia-Regular.woff2` (Tercia, weight 400, used for titles and names)
2. Open `fonts.css` and, in each `@font-face`, remove the `/*` and `*/` around the `url(...)` part.
3. Reload the page. Nothing else needs to change.

If your files have other names, change the file names in the `url(...)` lines to match.

Benne (body, weight 400) is free and is loaded from Google Fonts in `index.html`.

Until the files are added, the site uses the fallbacks: Helvetica Neue or Arial for headers, Georgia for titles.
