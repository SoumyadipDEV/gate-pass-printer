export interface User {
  email: string;
  id?: string;
  name?: string;
}

export interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}
