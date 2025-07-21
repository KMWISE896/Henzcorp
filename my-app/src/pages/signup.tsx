// src/pages/SignUp.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add real signup logic
    console.log("Sign Up:", { email, password });
    navigate("/dashboard"); // Navigate to home or dashboard after signup
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-black">
      <div className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-sm border border-blue-700/30">
        <h2 className="text-2xl text-white font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 rounded-md bg-slate-800 text-white focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 rounded-md bg-slate-800 text-white focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-blue-300 mt-4 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
