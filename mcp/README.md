# Ceneo Components MCP

Local MCP server for looking up the usage of Ceneo Design components in prototype projects.

## Tools

- `get_started` is the required first call. It returns this guide and the complete `src/theme/figma-variables.css` file.
- `components_list` lists components with a short description, default HTML example, and compiled CSS path.
- `component_spec` returns a component's example, compiled CSS path, CSS classes, class-backed variants, and relevant attributes. It does not ask for a target framework because it describes already available styles.
- `component_styles` returns the single compiled bundle at `src/theme/components.css` with no arguments, or one component's CSS when given `component`. Theme variables are returned only by `get_started`.

The compact `component.json` files are generated from each component's `component.definition.json` plus its TypeScript variant declarations and rendered class patterns. The same command compiles every component's SCSS into an adjacent CSS file and combines them into `src/theme/components.css`. After changing a component, its variants, or its styles, run `npm run components:generate`.

Example prompt in another application:

> First call `ceneo-components.get_started`, then call `ceneo-components.component_styles` to get the compiled component bundle (or pass `component: "Button"` for just Button). Look up `Button` with `ceneo-components.component_spec`, then use its HTML example and available classes. Also copy the complete token CSS. Do not recreate the component CSS.

Register the server in the MCP client with `npm` as the command and `--prefix`, the absolute project path, `run`, `mcp` as arguments. The server resolves component files relative to its own location, independently of the active workspace.

Start the server with `npm run mcp`. It communicates over standard input and output, so an MCP client is required to interact with it.

Run `npm run mcp:inspector` to launch the standard MCP Inspector. `npm run mcp:test` lists tools in the CLI.
