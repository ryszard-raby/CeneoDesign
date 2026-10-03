# Ceneo Components MCP

Local MCP server exposing technology-neutral component contracts to coding agents.

## Tools

- `list_components` lists reusable components with available specifications.
- `get_component_spec` returns behavior, API, accessibility and visual rules. It
	instructs the agent to use the target app's existing stack without installing
	dependencies.
- `get_design_tokens` returns the complete CSS file and exact values from
	`src/theme/figma-variables.css`
	for default, mobile, dark and mobile-dark themes.
- `read_component` reads reference source from `src` when implementation detail is needed.
- `read_styles` reads a CSS or SCSS file from `src`.

All paths are restricted to the `src` directory.

Example prompt in another application:

> Use `ceneo-components.get_component_spec` for `Button` with
> `targetStack: "ASP.NET Core Razor/CSHTML with scoped CSS"`. Implement and
> expose it as a reusable native component in that stack, using this
> application's existing conventions and primitives. Preserve its variants,
> icon slots and accessibility behavior. Do not add dependencies or return a
> plain HTML snippet. Use the resolved design token values from the response;
> do not guess colors from token names.

Register the server in the MCP client with `npm` as the command and
`--prefix`, the absolute project path, `run`, `mcp` as arguments. The server
resolves component files relative to its own location, independently of the
active workspace.

It can also be started manually with `npm run mcp`; in that mode it communicates
over standard input and output, so an MCP client is required to interact with it.

Run `npm run mcp:inspect` to open the local MCP Inspector, or `npm run mcp:test`
to perform a command-line smoke test that lists the available tools.
