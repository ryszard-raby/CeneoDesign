# Ceneo Design

Biblioteka komponentów Preact oparta na projekcie CeneoDesign w Figmie.

## Praca przez MCP

Agent powinien rozpocząć każdą sesję od wywołania narzędzia `get_started`.
Zwraca ono ten dokument oraz pełną zawartość `src/theme/figma-variables.css`.

Wymagana kolejność pracy:

1. Wywołaj `get_started` i zastosuj otrzymane zmienne CSS.
2. Wywołaj `list_components`, aby znaleźć dostępny komponent.
3. Wywołaj `get_component_spec` z nazwą komponentu i stosem aplikacji docelowej.
4. Używaj `read_component` lub `read_styles` tylko wtedy, gdy potrzebujesz szczegółów implementacji referencyjnej.

## Zasady implementacji

- Komponenty muszą korzystać ze zmiennych `--cd-*` z pliku motywu.
- Należy skopiować cały plik zmiennych, aby zachować tryby light, dark i mobile.
- Komponent należy zaimplementować natywnie w stosie aplikacji docelowej.
- Klasy należące do biblioteki używają prefiksu `cd-`.
- Nie należy instalować dodatkowego frameworka tylko po to, aby przenieść komponent.

## Lokalne polecenia

```shell
npm run dev
npm run build
npm run mcp
npm run mcp:inspect
npm run mcp:test
```
