import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ArgumentPage from './pages/ArgumentPage'
import DesignMockups from './mockups/DesignMockups'
import SeedPage from './pages/SeedPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mockup" element={<DesignMockups />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route path="/:treeId/:argumentId" element={<ArgumentPage />} />
      </Routes>
    </BrowserRouter>
  )
}
