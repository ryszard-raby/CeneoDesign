import { render } from 'preact'
import './styles.scss'
import './style/figma-variables.css'
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)
