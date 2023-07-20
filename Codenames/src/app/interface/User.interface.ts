export interface UserId {
  id: string;
  ip: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  isMaster: boolean;
  role: string;
  isAdmin: boolean;
}
