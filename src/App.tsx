import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainSite from './pages/MainSite'
import V2Experience from './pages/V2Experience'
import ImposterApp from './imposter/ImposterApp'
import MathImposter from './imposter/MathImposter'
import SimpleImposter from './imposter/SimpleImposter'
import ImageImposter from './imposter/ImageImposter'
import StreamImposter from './imposter/StreamImposter'

const RocketCatchApp = lazy(() => import('./rocket/RocketCatchApp'))
const Sudoku3DApp = lazy(() => import('./sudoku3d/Sudoku3DApp'))
const TetrisApp = lazy(() => import('./tetris/TetrisApp'))
const XBlasterApp = lazy(() => import('./xblaster/XBlasterApp'))
const StarbaseApp = lazy(() => import('./starbase/StarbaseApp'))
const OrbHopApp = lazy(() => import('./orb/OrbHopApp'))
const XTheGameApp = lazy(() => import('./xthegame/XTheGameApp'))

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
        <Route path="/v2" element={<V2Experience />} />
        <Route path="/imposter" element={<ImposterApp />} />
        <Route path="/party" element={<ImposterApp />} />
        <Route path="/math_imposter" element={<MathImposter />} />
        <Route path="/imposter_simple" element={<SimpleImposter />} />
        <Route path="/imposter_image" element={<ImageImposter />} />
        <Route path="/impasta_party" element={<StreamImposter />} />
        <Route path="/imposter_party" element={<StreamImposter />} />
        <Route path="/knicks" element={<KnicksPage />} />
        <Route
          path="/rocket_catch_game"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#061018] text-white p-8">Loading Starship...</div>}>
              <RocketCatchApp />
            </Suspense>
          }
        />
        <Route
          path="/3D_Sudoku"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#05060c] text-[#e7c37a] p-8 tracking-[0.2em] uppercase text-sm">Opening the cube…</div>}>
              <Sudoku3DApp />
            </Suspense>
          }
        />
        <Route
          path="/3d_sudoku"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#05060c] text-[#e7c37a] p-8 tracking-[0.2em] uppercase text-sm">Opening the cube…</div>}>
              <Sudoku3DApp />
            </Suspense>
          }
        />
        <Route
          path="/spacex_tetris"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#05070c] text-[#d5dbe2] p-8 tracking-[0.2em] uppercase text-sm">Ignition…</div>}>
              <TetrisApp />
            </Suspense>
          }
        />
        <Route
          path="/x_blaster"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#07080b] text-[#e8e8e8] p-8 tracking-[0.2em] uppercase text-sm">Charging rails…</div>}>
              <XBlasterApp />
            </Suspense>
          }
        />
        <Route
          path="/starbase"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#07080b] text-[#efe8dc] p-8 tracking-[0.2em] uppercase text-sm">Opening the pad…</div>}>
              <StarbaseApp />
            </Suspense>
          }
        />
        <Route
          path="/orb"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#050505] text-[#f4f4f4] p-8 tracking-[0.2em] uppercase text-sm">Waking Orb…</div>}>
              <OrbHopApp />
            </Suspense>
          }
        />
        <Route
          path="/x_the_game"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#050506] text-[#f4f4f4] p-8 tracking-[0.2em] uppercase text-sm">Loading the mark…</div>}>
              <XTheGameApp />
            </Suspense>
          }
        />
        <Route
          path="/x_the_game_v2"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#050506] text-[#f4f4f4] p-8 tracking-[0.2em] uppercase text-sm">Loading the mark…</div>}>
              <XTheGameApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
