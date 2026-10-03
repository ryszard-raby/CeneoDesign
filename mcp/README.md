# Ceneo Components MCP

Local MCP server exposing technology-neutral component contracts to coding agents.

## Tools

- `list_components` lists reusable components with available specifications.
- `get_component_spec` returns behavior, API, accessibility and visual rules. It
	instructs the agent to use the target app's existing stack without installing
	dependencies.
- `get_design_tokens` returns the exact values from `src/style/figma-variables.css`
	for default, mobile, dark and mobile-dark themes.
- `read_component` reads reference source from `src` when implementation detail is needed.
- `read_styles` reads a CSS or SCSS file from `src`.

All paths are restricted to the `src` directory.

Example prompt in another application:

> Use `ceneo-components.get_component_spec` for `Button`. Implement it using
> this application's existing framework, styling conventions and primitives.
> Preserve its variants, icon slots and accessibility behavior. Do not add
> dependencies. Use the resolved design token values from the response; do not
> guess colors from token names.

VS Code discovers the server in this workspace through `.vscode/mcp.json`. To
use it from other workspaces, register it in the VS Code user profile with an
absolute path to this project. The server resolves component files relative to
its own location, independently of the active workspace.

It can also be started manually with `npm run mcp`; in that mode it communicates
over standard input and output, so an MCP client is required to interact with it.