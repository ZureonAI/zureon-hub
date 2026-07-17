import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.zureon.hub',
  appName: 'ZUREON HUB',
  // Not used for page content anymore (see server.url below) — Capacitor CLI still wants
  // a webDir to exist for `cap sync`, but the app never loads from these bundled files.
  webDir: 'capacitor-www',
  server: {
    // HUB is a thin native wrapper around the real production site, not a bundled offline
    // app: load https://zureon.app directly instead of a locally-packaged copy of the
    // static export. This also means TonConnect wallet approval flows see the real
    // zureon.app origin (matching tonconnect-manifest.json) instead of "localhost", and
    // there's nothing to rebuild/resync into the APK when only the web app changes.
    url: 'https://zureon.app/hub-dist/',
  },
};

export default config;
