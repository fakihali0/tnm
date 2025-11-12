# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1b5d5c4f-1260-431d-b9ed-fedc311bbd61

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1b5d5c4f-1260-431d-b9ed-fedc311bbd61) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Framer Motion

## Animation pattern

Route-level animations share a single set of motion tokens defined in `src/components/animation/PageTransition.tsx`. Wrap page content with the `PageTransition` component (or reuse the exported `usePageMotion` hook) so every screen benefits from consistent entrance/exit variants while respecting `prefers-reduced-motion`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1b5d5c4f-1260-431d-b9ed-fedc311bbd61) and click on Share -> Publish.

## Environment configuration

The application expects a configured Supabase project in both local development and deployed environments. Define the following variables in a `.env` file (for local work) or in your hosting provider's environment/secret settings:

```bash
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-supabase-anon-key>"
```

Restart the dev server after updating the environment file so Vite can pick up the new values. Make sure the same variables are set in production deployments to avoid runtime errors when the Supabase client initializes.

### Required security headers for production

Ensure your CDN or hosting provider sends the same security headers that the development build assumes. They should match the `<meta http-equiv>` tags declared in `index.html`:

- **Content-Security-Policy**

  ```text
  default-src 'self'; script-src 'self' https://s3.tradingview.com https://www.tradingview-widget.com; style-src 'self' https://fonts.googleapis.com 'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://edzkorfdixvvvrkfzqzg.supabase.co https://s3.tradingview.com https://www.tradingview-widget.com wss:; frame-src https://www.tradingview-widget.com; worker-src 'self' blob:;
  ```

- **X-Content-Type-Options:** `nosniff`
- **X-Frame-Options:** `SAMEORIGIN`
- **X-XSS-Protection:** `1; mode=block`
- **Strict-Transport-Security:** `max-age=31536000; includeSubDomains`

Add any equivalent headers offered by your platform's UI or configuration files so they are enforced at the edge instead of relying solely on HTML meta tags.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
