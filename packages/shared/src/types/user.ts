export interface User {
  id: string;
  username: string;
  wins: number;
  losses: number;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponseDto {
  token: string; // userId for simplicity
  user: User;
}
