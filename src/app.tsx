import { useLayoutEffect, useState } from 'preact/hooks'
import { Button } from './components/button/button'
import { Layout } from './components/layout/layout'
import { Card } from './components/card/card'
import { Container } from './components/container/container'
import { Icon, iconNames } from './components/icon/icon'

const sections = ['Button', 'Card', 'Layout', 'Container', 'Icon']
const variants = ['primary', 'accent', 'outline', 'selected', 'dashed', 'blank', 'gray'] as const

function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('cd-preview-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage may be unavailable. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [search, setSearch] = useState('')
  useLayoutEffect(() => {
    document.documentElement.dataset.cdColorMode = theme
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem('cd-preview-theme', theme) } catch { /* Theme still works without storage. */ }
  }, [theme])

  const filteredIcons = iconNames.filter(name => name.includes(search.toLowerCase().trim()))
  return (
    <div class="preview">
      <header class="preview__header">
        <a href="#" class="preview__brand"><span>ceneo</span> Design</a>
        <div class="theme-switch" role="group" aria-label="Motyw podglądu">
          <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Jasny</button>
          <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Ciemny</button>
        </div>
      </header>
      <div class="preview__body">
        <aside class="preview__sidebar">
          <p class="eyebrow">Biblioteka</p>
          <nav aria-label="Komponenty">{sections.map((name, i) => <a href={`#${name.toLowerCase()}`} key={name}><span>0{i + 1}</span>{name}</a>)}</nav>
          <p class="preview__note">5 komponentów<br />43 ikony SVG</p>
        </aside>
        <main class="preview__main">
          <div class="preview__intro"><p class="eyebrow">Ceneo Design System</p><h1>Gotowe do użycia.</h1><p>Komponenty, warianty i ikony. Sprawdź, jak wyglądają w jasnym i ciemnym motywie.</p></div>
          <section id="button" class="preview-section">
            <header><h2>Button</h2><span>7 wariantów · 2 rozmiary</span></header>
            <div class="button-grid">{variants.map(variant => <div class="button-sample" key={variant}><code>{variant}</code><Button variant={variant}>Button</Button><Button variant={variant} size="small">Button</Button></div>)}</div>
            <div class="preview-row"><Button iconStart={<Icon name="cart-plus" />}>Dodaj do koszyka</Button><Button variant="outline" iconEnd={<Icon name="angle-right" />}>Zobacz więcej</Button><Button disabled>Niedostępny</Button></div>
          </section>
          <section id="card" class="preview-section">
            <header><h2>Card</h2><span>4 warianty</span></header>
            <div class="card-grid">{(['white', 'outlined', 'border-bottom', 'gray'] as const).map(cardStyle => <Card cardStyle={cardStyle} key={cardStyle}><Container direction="vertical" class="sample-content"><code>{cardStyle}</code><h3>Miejsce na treść</h3><p>Karta dopasowuje wysokość do zawartości.</p></Container></Card>)}</div>
          </section>
          <section id="layout" class="preview-section">
            <header><h2>Layout</h2><span>Responsywny</span></header>
            <p>Pełna dostępna szerokość. Padding poziomy od 721 px.</p>
            <div class="layout-stage"><Layout><Card cardStyle="gray"><Container direction="vertical" class="sample-content"><code>Layout → Card → Container</code><h3>Jedna struktura, różne ekrany.</h3><p>Zmień szerokość okna, aby zobaczyć zachowanie układu.</p></Container></Card></Layout></div>
          </section>
          <section id="container" class="preview-section">
            <header><h2>Container</h2><span>2 kierunki</span></header>
            <div class="container-grid">{(['horizontal', 'vertical'] as const).map(direction => <Card cardStyle="outlined" key={direction}><code>{direction}</code><Container direction={direction} class="container-demo">{['Pierwszy', 'Drugi', 'Trzeci'].map(label => <span class="demo-item" key={label}>{label}</span>)}</Container></Card>)}</div>
          </section>
          <section id="icon" class="preview-section">
            <header><h2>Icon</h2><span>{filteredIcons.length} / {iconNames.length} ikon</span></header>
            <label class="icon-search">Szukaj ikony<input type="search" value={search} onInput={event => setSearch(event.currentTarget.value)} placeholder="np. cart, search, heart" /></label>
            <div class="icon-grid">{filteredIcons.map(name => <div class="icon-sample" key={name}><Icon name={name} /><code>{name}</code></div>)}</div>
            {filteredIcons.length === 0 && <p role="status">Nie znaleziono ikon.</p>}
          </section>
        </main>
      </div>
    </div>
  )
}
