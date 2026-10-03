# Ceneo Components MCP

Local MCP server exposing technology-neutral component contracts to coding agents.

## Tools

- `list_components` lists reusable components with available specifications.
- The current component catalog includes `Button`, `Card`, `Container`, `Icon`
	and `Layout`. Each definition is stored next to its source as
	`src/components/<name>/component.json` and is discovered automatically.
- `get_component_spec` requires the client framework and styling stack, then
	returns behavior, API, accessibility and visual rules, including direct
	`resolvedStyles` values for every theme. Its response requires the agent to
	create and expose a reusable native component in that stack, without
	installing dependencies or returning a plain HTML snippet. Every generated
	component must use the `cd-` CSS class prefix and the manifest's base class.
- `get_design_tokens` returns the complete `src/theme/figma-variables.css` file
	plus parsed values for default, mobile, dark and mobile-dark themes. Copy the
	complete CSS file to the client to preserve all token and theme selectors.
- `read_component` reads reference source from `src` when implementation detail is needed.
- `read_styles` reads a CSS or SCSS file from `src`.

All paths are restricted to the `src` directory.

Example prompt in another application:

> Use `ceneo-components.get_component_spec` for `Button` with
> `targetStack: "ASP.NET Core Razor/CSHTML with scoped CSS"`. Implement and
> expose it as a reusable native component in that stack, using this
> application's existing conventions and primitives. Preserve its variants,
> icon slots and accessibility behavior. Do not add dependencies or return a
> plain HTML snippet. Use the `cd-button` root class and prefix all
> component-owned classes with `cd-`. Use the resolved design token values
> from the response; do not guess colors from token names.

VS Code discovers the server in this workspace through `.vscode/mcp.json`. To
use it from other workspaces, register it in the VS Code user profile with an
absolute path to this project. The server resolves component files relative to
its own location, independently of the active workspace.

It can also be started manually with `npm run mcp`; in that mode it communicates
over standard input and output, so an MCP client is required to interact with it.