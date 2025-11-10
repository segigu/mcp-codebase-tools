#!/usr/bin/env node

// This is a temporary entry point that will be replaced during build
// The actual entry point is src/cli/index.ts which gets compiled to dist/cli/index.js

import { CLI } from '../dist/cli/index.js';

CLI.run(process.argv);
