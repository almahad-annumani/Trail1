import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Actions supplies GITHUB_REPOSITORY as owner/repository.
// For a custom domain or a user/organisation site, use base: '/'.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  || process.env.VITE_REPO_NAME
  || 'REPOSITORY_NAME';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'
  || process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? `/${repositoryName}/` : '/',
});
