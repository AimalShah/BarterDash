---
description: Create a code screenshot and generate a social media caption
---

# Create Social Post

This workflow generates a screenshot of your code and writes a social media caption for it.

## Steps

1.  **Generate Screenshot**
    -   Run: `npm run shot -- <relative_file_path>`
    -   *Note: This saves the image to the `content/` directory.*

2.  **Generate Caption**
    -   Read the content of `<relative_file_path>`.
    -   Create a new file `content/<filename>-caption.md`.
    -   Write a LinkedIn/Twitter caption in that file. Use the following structure:
        -   **Hook**: Catchy first line about the problem or feature.
        -   **Context**: what this specific code does (technical but accessible).
        -   **Tech Tags**: #NestJS #TypeScript #BackendDev #BarterDash

## Example Prompt for Agent
"Run the create social post workflow for `src/modules/auth/auth.service.ts`."
