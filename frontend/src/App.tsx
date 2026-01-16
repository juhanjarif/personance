import { useState, useEffect, FC, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

interface LayoutProps {
    children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                             <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Personance
                             </Link>
                             <div className="hidden md:flex space-x-6">
                                <Link to="/" className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors">Dashboard</Link>
                                <Link to="/accounts" className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors">Accounts</Link>
                                <Link to="/transactions" className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors">Transactions</Link>
                             </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button 
                                onClick={toggleTheme} 
                                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all text-xs font-bold text-gray-700 dark:text-gray-200"
                                aria-label="Toggle Theme"
                                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            >
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </button>

                            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

                            <div className="flex items-center space-x-3">
                                <span className="hidden sm:block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{user?.name}</span>
                                <button 
                                    onClick={logout} 
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:hidden flex justify-center py-2 border-t border-gray-100 dark:border-gray-700 space-x-4">
                    <Link to="/" className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 hover:text-blue-600">Dashboard</Link>
                    <Link to="/accounts" className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 hover:text-blue-600">Accounts</Link>
                    <Link to="/transactions" className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 hover:text-blue-600">Transactions</Link>
                </div>
            </nav>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
            <Route path="/accounts" element={
            <PrivateRoute>
              <Layout>
                <Accounts />
              </Layout>
            </PrivateRoute>
          } />
            <Route path="/transactions" element={
            <PrivateRoute>
              <Layout>
                <Transactions />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
