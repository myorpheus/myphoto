import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import TrainModel from "./pages/TrainModel";
import AdminDashboard from "./pages/AdminDashboard";
import HeadshotGenerator from "./pages/HeadshotGenerator";
import Gallery from "./pages/Gallery";
import AdminRoute from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="headshots-ai-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/generate" element={<HeadshotGenerator />} />
            <Route path="/gallery" element={<Gallery />} />
            
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
            
            {/* Legacy /train route - redirect to admin */}
            <Route 
              path="/train" 
              element={
                <AdminRoute>
                  <TrainModel />
                </AdminRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
