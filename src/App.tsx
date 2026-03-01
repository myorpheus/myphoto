import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import AdminPhotos from "./pages/AdminPhotos";
import TrainModel from "./pages/TrainModel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOGSettings from "./pages/AdminOGSettings";
import HeadshotGenerator from "./pages/HeadshotGenerator";
import Gallery from "./pages/Gallery";
import AdminRoute from "./components/admin/AdminRoute";
import AuthRoute from "./components/AuthRoute";

const queryClient = new QueryClient();

// Apply saved OG & favicon settings on app load
const applySavedBranding = () => {
  try {
    const stored = localStorage.getItem('admin_og_settings');
    if (!stored) return;
    const s = JSON.parse(stored);
    const setMeta = (property: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', s.ogTitle);
    setMeta('og:description', s.ogDescription);
    setMeta('og:image', s.ogImage);
    setMeta('og:url', s.ogUrl);
    if (s.ogTitle) document.title = s.ogTitle;
    if (s.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
      link.rel = 'icon'; link.href = s.favicon;
      if (!document.querySelector("link[rel~='icon']")) document.head.appendChild(link);
    }
  } catch (e) { console.error('Failed to apply branding:', e); }
};
applySavedBranding();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="headshots-ai-theme">
      <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={
              <AuthRoute>
                <Dashboard />
              </AuthRoute>
            } />
            <Route path="/generate" element={
              <AuthRoute>
                <HeadshotGenerator />
              </AuthRoute>
            } />
            <Route path="/gallery" element={
              <AuthRoute>
                <Gallery />
              </AuthRoute>
            } />
            
            {/* Admin-only routes - protected with AdminRoute */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/train" 
              element={
                <AdminRoute>
                  <TrainModel />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin-og" 
              element={
                <AdminRoute>
                  <AdminOGSettings />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/photos" 
              element={
                <AdminRoute>
                  <AdminPhotos />
                </AdminRoute>
              } 
            />
            
            {/* Legacy /train route - redirect to admin */}
            <Route 
              path="/train" 
              element={
                <AuthRoute>
                  <TrainModel />
                </AuthRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
