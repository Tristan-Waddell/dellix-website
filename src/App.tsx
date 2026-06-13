import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { Portfolio } from './components/Portfolio'
import { About } from './components/About'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <>
      <a
        href="#top"
        className="sr-only rounded-md bg-lime-500 px-4 py-2 font-medium text-charcoal-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <Nav />

      <main>
        <Hero />
        {/* subtle divider between dark hero and content */}
        <Services />
        <Portfolio />
        <About />
        <Contact />
      </main>

      <Footer />
    </>
  )
}
