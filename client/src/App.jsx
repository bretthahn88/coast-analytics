import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DemoApp from './demo/DemoApp.jsx';
import BlogIndex from './blog/BlogIndex.jsx';
import BlogPost from './blog/BlogPost.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/demo/*" element={<DemoApp />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </ToastProvider>
  );
}
