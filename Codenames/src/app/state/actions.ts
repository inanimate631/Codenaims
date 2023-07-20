import { createAction, props } from '@ngrx/store';
import { User } from '../interface/User.interface';

export const connectUsers = createAction(
  'Get Users',
  props<{ users: User[] }>()
);

export const connectUser = createAction('Get User', props<{ user: User }>());

export const gameStarted = createAction(
  'Game Start',
  props<{ gameStart: boolean }>()
);
