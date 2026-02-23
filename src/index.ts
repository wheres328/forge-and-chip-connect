#!/usr/bin/env node

import { TUIApp } from './ui/app.js';

function main() {
  const app = new TUIApp();
  app.run();
}

main();
