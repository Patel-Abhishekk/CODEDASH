// test-frontend-mock.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock window and localStorage
global.window = {
    location: {
        hostname: process.argv[2] || 'localhost'
    }
};

global.localStorage = {
    getItem: (key) => null,
    setItem: () => {},
    removeItem: () => {}
};
global.sessionStorage = global.localStorage;

// We need to import the api.js file, but it uses ES modules and we are in a commonjs environment or vice versa?
// Let's just run it by modifying api.js temporarily for our test, or by compiling it.
// Actually, it's easier to simulate the requests using axios directly to show CORS works.
