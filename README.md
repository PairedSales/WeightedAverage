# WeightedAverage

WeightedAverage is a lightweight browser-based tool for calculating and presenting a weighted average of comparable sales for appraisal reports.

## Current functionality

The app now includes a working browser-based calculator with:

- Support for **3 to 10 comparable sales**
- User-entered **weights** and **adjusted sale prices**
- Automatic calculation of:
  - weighted contribution for each comparable
  - total weight
  - weighted average
- Decimal display options for **0**, **1**, or **2** decimals
- **Copy as Image** export using the report preview area
- Sample data and reset actions

## Running locally

Because this is a static site, you can either:

1. Open `index.html` directly in a browser, or
2. Serve the folder locally with Python:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Publishing to GitHub Pages

If you want to publish this repository to `github.io`, the quickest approach is:

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings**.
4. In the left sidebar, open **Pages**.
5. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** your main branch (usually `main`)
   - **Folder:** `/ (root)`
6. Click **Save**.
7. Wait for GitHub Pages to build the site.
8. GitHub will show the public URL near the top of the Pages screen.

Typical site URL:

```text
https://YOUR-USERNAME.github.io/WeightedAverage/
```

## Notes about clipboard export

- Modern Chromium-based browsers usually support image clipboard copy best.
- If direct clipboard image copy is not available in the browser, the app falls back to downloading a PNG instead.
