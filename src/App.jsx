import './App.css'
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './Components/Navbar/navbar'
import Profile from './pages/profile/Profile'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Media from './pages/Media/Media'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main>
            <div className="content-zone">
              <BrowserRouter basename="/MalaJunta">
                  <Route path="/" element={<Home />} />
                  <Route path="/media" element={<Media />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
              </BrowserRouter>
            </div>
          </main>
          <footer>
            <div className="footer">
              <p>&copy; 2025 Mala Junta. Todos los derechos reservados.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
