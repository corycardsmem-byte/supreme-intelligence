{
  "name": "@supreme-intelligence/api",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "@supreme-intelligence/core": "*",
    "@supreme-intelligence/governance": "*",
    "@supreme-intelligence/provenance": "*",
    "@supreme-intelligence/epistemic-mesh": "*"
  }
}
