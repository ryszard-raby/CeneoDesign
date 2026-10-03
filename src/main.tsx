import { render } from 'preact'
import './styles.scss'
import './theme/figma-variables.css'
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)
