import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ArgumentPage from './pages/ArgumentPage'
import DesignMockups from './mockups/DesignMockups'
import SeedPage from './pages/SeedPage'
import GeneratePage from './pages/GeneratePage'
import JsonFormatPage from './pages/JsonFormatPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/json-format" element={<JsonFormatPage />} />
        <Route path="/mockup" element={<DesignMockups />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route path="/:treeId/:argumentId" element={<ArgumentPage />} />
      </Routes>
    </BrowserRouter>
  )
}
