# Ceneo Design

Biblioteka komponentów Preact oparta na projekcie CeneoDesign w Figmie.

## Użycie przez MCP

1. Wywołaj `get_started` i skopiuj kompletny plik zmiennych CSS do projektu.
2. Wywołaj `component_styles` bez argumentów, aby pobrać arkusze CSS wszystkich komponentów, albo podaj nazwę komponentu, aby pobrać jeden arkusz.
3. Wywołaj `components_list`, aby znaleźć potrzebny element.
4. Wywołaj `component_spec` z nazwą, np. `Button`. Otrzymasz przykład HTML, klasy i dostępne warianty.

MCP służy do sprawdzania użycia istniejących styli. Nie generuje nowej implementacji komponentu. `component_styles` zwraca gotowe arkusze CSS komponentów.

## Manifesty komponentów

Każdy `src/components/*/component.json` jest krótkim manifestem użycia generowanym z `component.definition.json` oraz deklaracji typów i klas w komponencie. Skrypt kompiluje też źródłowe `*.scss` do osobnych plików `*.css` obok komponentów i do wspólnego `src/theme/components.css`.

Po zmianie komponentu lub jego wariantów wygeneruj manifesty ponownie:

```shell
npm run components:generate
```

## Lokalne polecenia

```shell
npm run dev
npm run build
npm run mcp
npm run mcp:inspector
npm run mcp:test
```

## Codex

Konfiguracja `.codex/config.toml` rejestruje lokalny serwer MCP pod nazwą `ceneo-components`. Codex wczytuje ją przy otwarciu nowej sesji. Pracę z MCP rozpocznij od `ceneo-components.get_started`.
