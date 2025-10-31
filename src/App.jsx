import './App.css'
import { BrowserRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './Components/Navbar/navbar'
import Profile from './pages/profile/Profile'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Media from './pages/Media/Media'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/MalaJunta">
        <div className="app">
          <Navbar />
          <main>
            <div className="content-zone">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/media" element={<Media />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>
          </main>
          <footer>
            <div className="footer">
              <p>&copy; 2025 Mala Junta. Todos los derechos reservados.</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
