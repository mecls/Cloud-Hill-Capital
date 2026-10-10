# Cloud Hill Capital website

A static site with no build step. The home page has four sections (Home, Manifesto, Team and Contact); the full manifesto has its own page.

```
index.html              home page (sections, team, contact)
manifesto.html          the full manifesto, with a contents sidebar
assets/css/style.css    styles; motion values are from the reference sites
assets/js/main.js       menu scroll, current-section highlight, phone menu, team intro
assets/js/manifesto.js  manifesto contents highlight and phone contents dropdown
assets/img/logo.webp    home logo (square, mark centred on the exact centre of the image)
assets/team/            team portraits
fonts/                  drop-in folder for the licensed fonts (see fonts/README.md)
```

## Preview

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Where to change things

| What | Where |
|---|---|
| Logo | `index.html`, the `src` of `<img class="home__logo">`. Use a square image with the mark centred, so it rotates on its centre. |
| Logo size | `style.css`, `--logo-size` |
| Fonts | Put the files in `fonts/` and uncomment the `url()` lines in `fonts/fonts.css` |
| Mission statement | `index.html`, section `#manifesto` |
| Manifesto text | `manifesto.html`. Each chapter is a `<section class="mf-ch">`; the sidebar links are in `<nav class="mf-toc">`. |
| People, roles, bios | `index.html`, one `<li class="person">` per person. The bio is the `<p class="person__bio">` inside it. |
| Portraits | Replace `<svg class="portrait">…</svg>` with `<img class="portrait" src="assets/team/NAME.webp" alt="">` (3:4 white line drawing) and delete the `[Portrait]` tag |
| City, emails, LinkedIn | `index.html`, section `#contact` (change the `mailto:` and LinkedIn `href` too) |
| Favicon | `assets/img/favicon.png`, `assets/img/apple-touch-icon.png` |

Anything still undecided is written in `[brackets]` on the page.
