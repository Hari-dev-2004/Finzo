// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Community from "./pages/Community";
import CommunityDiscussions from "./pages/CommunityDiscussions";
import GroupDetail from "./pages/GroupDetail";
import Learn from "./pages/Learn";
import CourseDetail from "./pages/CourseDetail";
import Research from "./pages/Research";
import PersonalData from "./pages/PersonalData";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerification from "./pages/OtpVerification";
import ResetPassword from "./pages/ResetPassword";
import Recommendations from "./pages/Recommendations";
import { AuthProvider } from "@/context/AuthContext";
import Axios from "@/api/axios";
import ProtectedRoute from "@/pages/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter> {/* Moved to wrap AuthProvider */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider> {/* Now inside BrowserRouter */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user-profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/user-profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/community" element={<Community />} />
            <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
            <Route path="/community-discussions" element={<ProtectedRoute><CommunityDiscussions /></ProtectedRoute>} />
            <Route path="/community/post/:postId" element={<ProtectedRoute><CommunityDiscussions /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
            <Route path="/learn/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/research" element={<Research />} />
            <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
            <Route path="/personal-data" element={<PersonalData />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;