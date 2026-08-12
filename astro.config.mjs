import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nkstudios.dev',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap()],
  env: {
    schema: {
      SMTP_HOST: envField.string({
        context: 'server',
        access: 'secret',
        default: 'smtp.hostinger.com',
      }),
      SMTP_PORT: envField.number({
        context: 'server',
        access: 'secret',
        default: 465,
      }),
      SMTP_SECURE: envField.boolean({
        context: 'server',
        access: 'secret',
        default: true,
      }),
      SMTP_USER: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SMTP_PASSWORD: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CONTACT_RECIPIENT: envField.string({
        context: 'server',
        access: 'secret',
        default: 'nikolasguedes@nkstudios.dev',
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
