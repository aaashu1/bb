# Happy Birthday Website — Setup Guide

This is a fully working interactive birthday experience:

**Cake → Light candles → Blow into the mic → Confetti/hearts →
Envelope → Flip-through photo book**

## 1. Files

```
index.html      the page structure
styles.css      all styling & animations
script.js       all interactivity
assets/         put your photos & audio here
```

Everything is plain HTML/CSS/JS — no build step. Just open
`index.html` in a browser, or upload the whole folder to any
static host (GitHub Pages, Netlify, Vercel, etc).

> ⚠️ The microphone feature (`getUserMedia`) only works over
> **HTTPS** or on **localhost**. If you open the file directly
> from your computer (`file://...`) most browsers will block
> the mic — that's expected. A "No mic? Tap here instead" button
> appears automatically as a fallback either way, so the site
> still works everywhere.

## 2. Add your own assets

Drop these files into the `assets/` folder using these exact names
(the site already links to them):

| File                        | What it is                         |
|-----------------------------|-------------------------------------|
| `assets/birthday-song.mp3`  | Plays while the candles are lit     |
| `assets/pop.mp3`            | Small pop as each candle lights     |
| `assets/whoosh.mp3`         | Plays when the envelope opens       |
| `assets/photo1.jpg`         | Photo on book page 2                |
| `assets/photo2.jpg`         | Photo on book page 4                |
| `assets/photo3.jpg`         | Photo on book page 6                |
| `assets/hero-bg.png`        | Full-site background photo (already included) |

If any of these are missing, the site won't break — audio just
stays silent, and missing photos show a friendly "add a photo
here" placeholder instead of a broken image icon.

## 3. Personalize the text

Open `index.html` and edit:

- The intro line above the cake (`<h2 class="intro-text">`)
- The book pages inside `<section id="bookScene">` — there are 6
  pages by default (3 message pages + 3 photo pages). Edit the
  `<p>` text directly, or copy/paste a `<div class="page">...</div>`
  block to add more pages.

## 4. What was fixed from the original draft

The original script had a few bugs that stopped the site from
working at all:

- `birthdaySong` was declared twice with `const`, which is a fatal
  JavaScript syntax error — it silently broke *every* script on
  the page.
- `lightOneByOne()` was called but never defined, so clicking
  "Light the Candles" would light nothing.
- `detectBlow()` and `startCelebration()` were each defined twice.
- The envelope scene was being force-shown at page load (before
  the cake/blowing/celebration even happened), overlapping the
  cake scene.
- `fadeMusic()` was called but never defined.

This version fixes all of the above, adds a no-microphone fallback
button, adds graceful placeholders for missing photos, and
generates the ambient fairy lights in the background (the HTML had
a container for them but nothing ever filled it in).

## 5. Background photo & text color

The site now uses your uploaded photo (`assets/hero-bg.png`) as a
full-page background behind every scene. Since the photo is bright
and busy in places, headings and body text were switched to a warm
cream (`#fff6ec`) with a soft dark glow instead of plain white, and
a rose-tinted dark overlay (`.siteOverlay` in `styles.css`) sits
between the photo and the text — heavier toward the center where
the cake/text sit, lighter near the top where the photo is already
dark. If you swap in a different photo and text is still hard to
read, try increasing the overlay opacity values in the
`.siteOverlay` rule in `styles.css`.

The celebratory floating-hearts burst was also toned down from 35
hearts to 8 (see `createHearts()` in `script.js` — change the `8`
back up, or to `0` to remove hearts entirely).
