import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LibraryPage from './pages/LibraryPage'
import PracticePage from './pages/PracticePage'

const ImportPage = lazy(() => import('./pages/ImportPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/practice/:id" element={<PracticePage />} />
        <Route
          path="/import"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-dvh items-center justify-center bg-surface text-sm font-semibold text-matcha-sage">
                  Loading audio import…
                </div>
              }
            >
              <ImportPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
