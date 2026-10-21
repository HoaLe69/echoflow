import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LibraryPage from './pages/LibraryPage'
import PracticePage from './pages/PracticePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/practice/:id" element={<PracticePage />} />
      </Routes>
    </BrowserRouter>
  )
}
