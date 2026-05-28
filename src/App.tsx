import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainSite from './pages/MainSite'

function KnicksPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-6xl font-semibold tracking-tighter">Knicks Fan Page</h1>
      <p className="mt-4 text-[#a3a3a3]">Coming soon (we’ll build the corny version next).</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/knicks" element={<KnicksPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
