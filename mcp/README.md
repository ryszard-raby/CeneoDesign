# Ceneo Components MCP

Local MCP server exposing the application's component source to coding agents.

## Tools

- `list_components` lists JSX/TSX files and their exported component names.
- `get_component_bundle` returns every source and style file needed for a named component.
- `read_component` reads a source file from `src`.
- `read_styles` reads a CSS or SCSS file from `src`.

All paths are restricted to the `src` directory.

VS Code discovers the server in this workspace through `.vscode/mcp.json`. To
use it from other workspaces, register it in the VS Code user profile with an
absolute path to this project. The server resolves component files relative to
its own location, independently of the active workspace.

It can also be started manually with `npm run mcp`; in that mode it communicates
over standard input and output, so an MCP client is required to interact with it.