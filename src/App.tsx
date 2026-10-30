import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LibraryPage from './pages/LibraryPage'
import PracticePage from './pages/PracticePage'

const ImportPage = lazy(() => import('./pages/ImportPage'))
const FreeTalkPage = lazy(() => import('./pages/FreeTalkPage'))
const FreeTalkReviewPage = lazy(
  () => import('./pages/FreeTalkReviewPage'),
)

const pageLoading = (label: string) => (
  <div className="flex min-h-dvh items-center justify-center bg-surface text-sm font-semibold text-matcha-sage">
    {label}
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/practice/:id" element={<PracticePage />} />
        <Route
          path="/speak"
          element={
            <Suspense fallback={pageLoading('Loading Free Talk…')}>
              <FreeTalkPage />
            </Suspense>
          }
        />
        <Route
          path="/speak/:id"
          element={
            <Suspense fallback={pageLoading('Loading review…')}>
              <FreeTalkReviewPage />
            </Suspense>
          }
        />
        <Route
          path="/import"
          element={
            <Suspense fallback={pageLoading('Loading audio import…')}>
              <ImportPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
