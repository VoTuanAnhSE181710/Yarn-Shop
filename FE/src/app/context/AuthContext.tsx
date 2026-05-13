import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type UserRole = "admin" | "staff" | "user";

interface User {
  email: string;
  phone: string;
  name: string;
  avatar: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (emailOrPhone: string, password: string) => boolean;
  signOut: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const demoAccounts = [
  {
    email: "admin@gmail.com",
    phone: "123456789",
    password: "123",
    name: "Admin User",
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=E07A7A&color=fff&size=200",
    role: "admin" as UserRole,
  },
  {
    email: "staff@gmail.com",
    phone: "987654321",
    password: "123",
    name: "Staff User",
    avatar: "https://ui-avatars.com/api/?name=Staff+User&background=A8C5B2&color=fff&size=200",
    role: "staff" as UserRole,
  },
  {
    email: "tranngoc5979@gmail.com",
    phone: "0703339186",
    password: "123",
    name: "Tran Ngoc",
    avatar: "https://ui-avatars.com/api/?name=Tran+Ngoc&background=E09F7D&color=fff&size=200",
    role: "user" as UserRole,
  },
  {
    email: "kamuikatzzz@gmail.com",
    phone: "0909315708",
    password: "123",
    name: "Kamui Katz",
    avatar: "https://ui-avatars.com/api/?name=Kamui+Katz&background=D4A5A5&color=fff&size=200",
    role: "user" as UserRole,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("cozyStitch_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("cozyStitch_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cozyStitch_user");
    }
  }, [user]);

  const signIn = (emailOrPhone: string, password: string): boolean => {
    const account = demoAccounts.find(
      (acc) =>
        (acc.email === emailOrPhone || acc.phone === emailOrPhone) &&
        acc.password === password
    );

    if (account) {
      setUser({
        email: account.email,
        phone: account.phone,
        name: account.name,
        avatar: account.avatar,
        role: account.role,
      });
      return true;
    }

    return false;
  };

  const signOut = () => {
    setUser(null);
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
