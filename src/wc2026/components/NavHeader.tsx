import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, LogIn, LogOut, Loader2, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { registerUser, loginUser, logoutUser, isAuthenticated } from '@wc/lib/api';
import { useToast } from '@/hooks/use-toast';

const REMEMBER_KEY = 'wc2026_remembered_creds';

type RememberedCreds = {
  username?: string;
  email?: string;
  password?: string;
  remember?: boolean;
};

const loadRemembered = (): RememberedCreds => {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as RememberedCreds) : {};
  } catch {
    return {};
  }
};

const saveRemembered = (creds: RememberedCreds) => {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(creds));
  } catch {
    /* ignore quota / privacy errors */
  }
};

export const NavHeader = () => {
  const remembered = loadRemembered();
  const [username, setUsername] = useState(remembered.username ?? '');
  const [email, setEmail] = useState(remembered.email ?? '');
  const [password, setPassword] = useState(remembered.password ?? '');
  const [rememberMe, setRememberMe] = useState(remembered.remember ?? true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const resetForm = () => {
    // Reload remembered creds so the form stays prefilled for next time
    const r = loadRemembered();
    setUsername(r.username ?? '');
    setEmail(r.email ?? '');
    setPassword(r.password ?? '');
    setRememberMe(r.remember ?? true);
  };


  useEffect(() => {
    const handleOpenLogin = () => {
      setIsRegisterOpen(false);
      setIsLoginOpen(true);
    };

    const handleOpenRegister = () => {
      setIsLoginOpen(false);
      setIsRegisterOpen(true);
    };

    const handleAuthChanged = () => {
      setLoggedIn(isAuthenticated());
    };

    window.addEventListener('open-login', handleOpenLogin);
    window.addEventListener('open-register', handleOpenRegister);
    window.addEventListener('auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('open-login', handleOpenLogin);
      window.removeEventListener('open-register', handleOpenRegister);
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
  }, []);

  // After password reset: auto-open login dialog and prefill email
  useEffect(() => {
    const shouldOpen = sessionStorage.getItem('wc2026_open_login');
    if (shouldOpen === 'true') {
      const prefillEmail = sessionStorage.getItem('wc2026_prefill_email');
      sessionStorage.removeItem('wc2026_open_login');
      sessionStorage.removeItem('wc2026_prefill_email');
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
      setIsRegisterOpen(false);
      setIsLoginOpen(true);
    }
  }, [location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    try {
      const result = await loginUser(username, email, password);
      saveRemembered({
        username,
        email,
        password: rememberMe ? password : undefined,
        remember: rememberMe,
      });
      setLoggedIn(true);
      window.dispatchEvent(new Event('auth-changed'));
      toast({
        title: 'Welcome back!',
        description: result.message,
      });
      setIsLoginOpen(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setIsLoading(true);
    
    try {
      const result = await registerUser(username, email, password);
      // Persist credentials so the upcoming login dialog is prefilled
      saveRemembered({
        username,
        email,
        password: rememberMe ? password : undefined,
        remember: rememberMe,
      });
      toast({
        title: 'Account created!',
        description: result.message,
      });
      setIsRegisterOpen(false);
      // Switch to login dialog with creds already filled in
      setIsLoginOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setRegisterError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-display text-xl font-bold text-foreground">WC 2026 <span className="text-accent">Predictor</span></span>
        </div>

        {/* Nav Links — WC2026 routes are nested under /wc2026 in the tabbed app */}
        <div className="flex items-center gap-1">
          <Button
            variant={location.pathname === '/wc2026' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/wc2026')}
            className="gap-1"
          >
            ⚽ <span className="hidden sm:inline">Predictor</span>
          </Button>
          <Button
            variant={location.pathname === '/wc2026/groups' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/wc2026/groups')}
            className="gap-1"
          >
            🏆 <span className="hidden sm:inline">Groups</span>
          </Button>
          <Button
            variant={location.pathname === '/wc2026/benchmark' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/wc2026/benchmark')}
            className="gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Benchmark</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1"
          >
            <span className="hidden sm:inline">← PSL</span>
            <span className="sm:hidden">PSL</span>
          </Button>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-1">
          {loggedIn ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                logoutUser();
                // Keep username/email prefilled, but always drop stored password on logout
                const r = loadRemembered();
                saveRemembered({ username: r.username, email: r.email, remember: false });
                setPassword('');
                setRememberMe(false);
                setLoggedIn(false);
                window.dispatchEvent(new Event('auth-changed'));
                toast({
                  title: 'Logged out',
                  description: 'You have been successfully logged out.',
                });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <>
              {/* Login Dialog */}
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  <LogIn className="h-5 w-5 text-primary" />
                  Login to WC 2026 Predictor
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-destructive">{loginError}</p>
                )}
                <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me on this device
                </label>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
                <div className="space-y-2 text-center text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setIsLoginOpen(false);
                      navigate('/forgot-password');
                    }}
                  >
                    Forgot password?
                  </button>
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        setIsLoginOpen(false);
                        setIsRegisterOpen(true);
                      }}
                    >
                      Register
                    </button>
                  </p>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Register Dialog */}
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/10">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Register</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  <User className="h-5 w-5 text-primary" />
                  Create an Account
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="register-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {registerError && (
                  <p className="text-sm text-destructive">{registerError}</p>
                )}
                <div className="text-xs text-muted-foreground mb-2">
                  Password must: be 8+ characters, include uppercase, lowercase, digit, and special character
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setIsRegisterOpen(false);
                      setIsLoginOpen(true);
                    }}
                  >
                    Login
                  </button>
                </p>
              </form>
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
