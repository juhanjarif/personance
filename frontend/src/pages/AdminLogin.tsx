import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded Admin Credentials
    if (
      email === "admin@personance.com" &&
      password === "personanceAdmin2026"
    ) {
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/admin");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-10 bg-gray-800 rounded-[2.5rem] border border-gray-700 shadow-none">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-blue-900/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Security
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Admin Portal
          </h2>
          <p className="text-gray-400 mt-2 text-sm font-medium">
            Please sign in to access auditing tools.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-900/20 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-6 py-4 rounded-2xl border border-gray-700 bg-gray-900/50 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium placeholder:text-gray-600"
              placeholder="admin@personance.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-6 py-4 rounded-2xl border border-gray-700 bg-gray-900/50 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium placeholder:text-gray-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
