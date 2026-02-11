# How to Deploy GameBoy OS to Vercel

The application is now ready for deployment! Follow these simple steps.

## Option 1: Direct Command Line (Recommended)

1.  Open your terminal in this project folder.
2.  Run the following command:
    ```bash
    npx vercel --prod
    ```
3.  Follow the prompts:
    - **Set up and deploy?** [Y]
    - **Which scope?** [Select your account]
    - **Link to existing project?** [N]
    - **Project name?** [gb-os-karaoke] (or press Enter)
    - **In which directory?** [./] (Press Enter)
    - **Want to modify these settings?** [N]

Wait for the deployment to finish. You will get a recursive URL (e.g., `https://gb-os-karaoke.vercel.app`).

## Option 2: GitHub Integration

1.  Push your code to a GitHub repository.
2.  Go to [Vercel.com](https://vercel.com) and log in.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your GitHub repository.
5.  Click **Deploy**.

## ⚠️ Important Note About PWA Icons

The `manifest.json` file references `icon-192.png` and `icon-512.png`. These are currently missing from the root folder.

- **Action Required**: Please add two square images (one 192x192px, one 512x512px) named `icon-192.png` and `icon-512.png` to the root folder before deploying if you want users to be able to "Install App" on their phones correctly.
- Without these icons, the app will work in the browser, but the install prompt might fail or show a default icon.
