import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserStateInterface } from './state.interface';

export const selectUsersState =
  createFeatureSelector<UserStateInterface>('Users');

export const selectMainUser = createSelector(
  selectUsersState,
  (state: UserStateInterface) => state.mainUser
);

export const selectUsersArray = createSelector(
  selectUsersState,
  (state: UserStateInterface) => state.users
);

export const selectGameStart = createSelector(
  selectUsersState,
  (state: UserStateInterface) => state.gameStart
);
