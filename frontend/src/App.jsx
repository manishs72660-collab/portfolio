import { Routes, Route } from 'react-router-dom';
import { Navbar, Contact } from './components.jsx';
import { Home, Projects, ProjectDetail, Blog, BlogPost, Education } from './pages.jsx';
import Admin from './Admin.jsx';
import ChatWidget from './ChatWidget.jsx';
export default function App() {
  return (<>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/education" element={<Education />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
    <footer className="py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} Portfolio</footer>
    <ChatWidget />
  </>);
}
