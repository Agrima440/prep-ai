import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import OTP from "./pages/OTP.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InterviewForm from "./pages/InterviewForm.jsx";
import InterviewReport from "./pages/InterviewReport.jsx";
function App() {
  return (
    <>
      <Toaster position="top-right" />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview" element={<InterviewForm />} />
<Route path="/report" element={<InterviewReport />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
