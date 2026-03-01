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
