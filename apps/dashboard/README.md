# Shadcn UI Kit

A large collection of admin dashboards, website templates, UI components, and ready-to-use blocks. Save time and deliver projects faster.

This is a [Next.js 16](https://nextjs.org/) project bootstrapped with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and React 19.

## Installation

Follow these steps to get your project up and running locally:

1. Clone the repository:

    ```sh
    git clone https://github.com/bundui/shadcn-ui-kit-dashboard.git
    cd shadcn-ui-kit-dashboard
    ```

2. Install dependencies:

    ```sh
    # Production / CI
    npm install

    # Local development
    bun install
    ```

   If you encounter any problems installing packages, try adding the `--legacy-peer-deps` or `--force` flag:

    ```sh
    npm install --legacy-peer-deps
    ```

3. Run the development server:

    ```sh
    bun run dev
    ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the result.

4. To edit the project, you can examine the files under the app folder and components folder.

5. For production builds:

    ```sh
    npm run build --turbo
    npm run start
    ```

## Minimum system requirements

- Node.js version 20 and above.

Note: If you experience problems with versions above Node.js v20, please replace with version v20.