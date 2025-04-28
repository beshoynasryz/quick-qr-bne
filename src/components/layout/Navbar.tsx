
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-white shadow-sm py-3 sticky top-0 z-10">
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-xl text-brand-blue">BNE QR</span>
        </Link>

        {/* Mobile Menu Button */}
        <button 
          onClick={toggleMenu} 
          className="md:hidden p-2 text-brand-black"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-brand-black hover:text-brand-blue">
            Home
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-brand-black hover:text-brand-blue">
                Dashboard
              </Link>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="absolute top-14 left-0 right-0 bg-white shadow-md py-4 px-6 flex flex-col gap-4 md:hidden animate-fade-in">
            <Link 
              to="/" 
              className="text-brand-black hover:text-brand-blue py-2"
              onClick={toggleMenu}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-brand-black hover:text-brand-blue py-2"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Button 
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }} 
                  variant="outline"
                  className="w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={toggleMenu}>
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={toggleMenu}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
