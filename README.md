# CW3 Engineering website

Single page site for CW3 Engineering, Inc., a civil engineering firm in North Fort Myers, Florida.

Plain HTML, CSS and vanilla JavaScript. No build step, no framework.

```
index.html            page markup and copy
assets/css/style.css  design tokens, layout, hover states, animations
assets/js/main.js     scroll reveals, counters, horizontal work rail, service previews, form
assets/img/favicon.svg
```

Run locally with any static server, for example `python3 -m http.server`, then open http://localhost:8000.

Notes
* Brand orange `#F1870D` comes from the current cw-3.com site.
* Photos are loaded from the existing GoDaddy image CDN (img1.wsimg.com). Every photo slot has a blueprint grid fallback, so the layout holds if an image is missing. Swap in local files under `assets/img` when the client sends originals.
* The contact form opens a prefilled email to CWright@CW-3.com. Point it at a form service (Formspree, Netlify Forms, etc.) if the client wants submissions stored.
* Motion respects `prefers-reduced-motion`.
