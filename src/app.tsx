const components = [
  { name: 'Button', status: 'Gotowy' },
  { name: 'Input', status: 'Gotowy' },
  { name: 'Modal', status: 'W planach' },
]

const colors = ['#ff5a00', '#1a1a1a', '#f5f5f5', '#ffffff']

export function App() {
  return (
    <main>
      <header class="topbar">
        <a class="brand" href="/" aria-label="Ceneo Design - strona główna">
          <span class="brand__mark">c</span>
          <span>Ceneo Design</span>
        </a>
        <span class="tech-badge">Preact + TypeScript + SCSS</span>
      </header>

      <section class="intro">
        <p class="eyebrow">System projektowy</p>
        <h1>Jedno miejsce dla spójnych doświadczeń.</h1>
        <p class="intro__copy">
          Lekki punkt startowy do budowy komponentów, tokenów i dokumentacji
          interfejsu Ceneo.
        </p>
      </section>

      <section class="workspace" aria-label="Przegląd systemu projektowego">
        <div class="panel">
          <div class="panel__heading">
            <div>
              <p class="eyebrow">Biblioteka</p>
              <h2>Komponenty</h2>
            </div>
            <span>{components.length}</span>
          </div>
          <ul class="component-list">
            {components.map((component) => (
              <li key={component.name}>
                <strong>{component.name}</strong>
                <span>{component.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div class="panel panel--tokens">
          <div class="panel__heading">
            <div>
              <p class="eyebrow">Fundamenty</p>
              <h2>Kolory</h2>
            </div>
          </div>
          <div class="swatches" aria-label="Paleta kolorów">
            {colors.map((color) => (
              <div class="swatch" key={color}>
                <span style={{ backgroundColor: color }} />
                <code>{color}</code>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
