---
description: How to turn code into beautiful screenshots for social media
---

# Create Social Media Content

We use `carbon-now-cli` to generate beautiful code images directly from the terminal.

## Usage

Run the `shot` command followed by the file path:

```bash
npm run shot src/modules/auth/auth.service.ts
```

## Options

### Interactive Mode (Recommended)
This opens the Carbon UI in a dedicated window/tab where you can customize the theme, font, and window controls before saving.

```bash
npm run shot -- -i src/main.ts
```

### Copy to Clipboard
Generate the image and copy it directly to your clipboard (great for pasting into Twitter/LinkedIn).

```bash
npm run shot -- -c src/main.ts
```

### Select Lines
Only screenshot lines 10 to 20:

```bash
npm run shot -- -s 10 -e 20 src/main.ts
```

## Tips
- **Headless**: By default, it runs in headless mode and saves the image to the `content/` directory.
- **Presets**: You can save your favorite settings as a preset to keep a consistent brand style.
