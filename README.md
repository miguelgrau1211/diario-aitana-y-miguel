# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deploying to Netlify

To deploy this project to Netlify, follow these steps:

1.  **Push to Git**: Push your project to a GitHub, GitLab, or Bitbucket repository.
2.  **Create a Netlify Site**: In your Netlify dashboard, select "Add new site" > "Import an existing project" and choose your repository.
3.  **Configure Environment Variables**: This is a critical step. Your app needs the Firebase and Genkit API keys to function. In your Netlify site's settings under **Site configuration > Environment variables**, add all the variables from your local `.env` file. These include:
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`
    *   `GEMINI_API_KEY`
4.  **Deploy**: The `netlify.toml` file in this project is already configured with the correct build command and settings. Simply click the "Deploy site" button in Netlify.
