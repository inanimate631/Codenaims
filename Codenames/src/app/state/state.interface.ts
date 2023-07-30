import { User } from '../interface/User.interface';

export interface UserStateInterface {
  users: User[] | null;
  mainUser: User | null;
  gameStart: boolean;
  error: string | null;
}
