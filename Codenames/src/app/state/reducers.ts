import { createReducer, on } from '@ngrx/store';
import { UserStateInterface } from './state.interface';
import * as PostsActions from './actions';

export const initialState: UserStateInterface = {
  users: [],
  gameStart: false,
  mainUser: null,
  error: null,
};

export const userReducers = createReducer(
  initialState,
  on(PostsActions.connectUsers, (state, action) => ({
    ...state,
    users: [...action.users],
  })),
  on(PostsActions.connectUser, (state, action) => ({
    ...state,
    mainUser: action.user,
  })),
  on(PostsActions.gameStarted, (state, action) => ({
    ...state,
    gameStart: action.gameStart,
  }))
);
