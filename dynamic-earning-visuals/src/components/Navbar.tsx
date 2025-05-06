import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <header className="w-full bg-finzo-black border-b border-muted/20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gradient">Finzo</Link>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link to="/recommendations" className="text-muted-foreground hover:text-foreground">
            Recommendations
          </Link>
          <Link to="/community" className="text-muted-foreground hover:text-foreground">
            Community
          </Link>
          <Link to="/research" className="text-muted-foreground hover:text-foreground">
            Research
          </Link>
          <Link to="/learn" className="text-muted-foreground hover:text-foreground">
            Learn
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <User className="h-4 w-4" />
                My Account
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-background rounded-md shadow-xl z-50 border border-border">
                      <Link 
                    to="/user-profile" 
                    className="block px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setShowDropdown(false)}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/personal-data" 
                    className="block px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setShowDropdown(false)}
                  >
                    Financial Profile
                  </Link>
                  <div className="border-t border-border my-1"></div>
                  <button 
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-3 w-3" />
                      Log Out
                    </div>
                  </button>
                </div>
              )}
            </div>
              ) : (
                <>
              <Link to="/login">
                <Button variant="ghost" className="hidden md:flex">Log In</Button>
                  </Link>
              <Link to="/register">
                <Button className="bg-finzo-purple hover:bg-finzo-dark-purple">Sign Up</Button>
                  </Link>
                </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
