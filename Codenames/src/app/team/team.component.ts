import { GameService } from './../services/game/game.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '../interface/User.interface';
import { selectMainUser, selectUsersArray } from '../state/selectors';
import { UserService } from '../services/user/user.service';
import { Observable, Subscription, timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { Timer, colorOnCart } from '../interface/Game.interface';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
})
export class TeamComponent implements OnInit, OnDestroy {
  @Input() teamName!: string;
  usersArray!: User[];
  user: User | null = null;
  team: User[] = [];
  master: User | null = null;
  name: string = '';
  wordAmount: number | null = null;
  redGameWord: string[] = [];
  blueGameWord: string[] = [];
  inputWord: string = '';
  teamMove: string | null = null;

  redMasterWord: number[] = [];
  blueMasterWord: number[] = [];
  blackMasterWord: number | null = null;

  mainUser$: Subscription | null = null;
  usersArray$: Subscription | null = null;
  masterWordsSubject$: Subscription | null = null;

  time = '01:00';
  teamMoveColor: string | null = null;
  isTeamMove = false;

  teamEndTurn: colorOnCart[] = [];
  teamUsersRedCounter: number | null = null;
  teamUsersBlueCounter: number | null = null;

  roundTimeout: any;

  constructor(
    private store: Store,
    public UserService: UserService,
    private GameService: GameService,
    private http: HttpClient,
    private socket: Socket
  ) {}

  ngOnInit(): void {
    this.mainUser$ = (
      this.store.select(selectMainUser) as Observable<User>
    ).subscribe((user) => {
      this.user = user;
      if (user) {
        this.name = (this.user as User).name;
      }
    });
    this.usersArray$ = (
      this.store.select(selectUsersArray) as Observable<User[]>
    ).subscribe((users) => {
      if (users) {
        this.team = [];
        this.master = null;
        users.forEach((user) => {
          if (user.role === this.teamName) {
            this.team.push(user);
          } else if (user.role === `Master${this.teamName}`) {
            this.master = user;
          } else {
            this.team = this.team.filter((user) => user.id === this.user?.id);
          }
        });
      }
    });
    this.masterWordsSubject$ = this.GameService.masterWordsSubject$.subscribe(
      (v) => {
        if (this.teamName === 'red') {
          this.wordAmount = v.redWords.length;
        } else {
          this.wordAmount = v.blueWords.length;
        }
        this.blueMasterWord = v.blueWords;
        this.redMasterWord = v.redWords;
        this.blackMasterWord = v.blackWords;

        if (v.blueWords.length < 1 || v.redWords.length < 1) {
          this.GameService.gameEnd(this.teamMoveColor as string);
        }
      }
    );
    this.socket.on('/getBlueTeamWord', (blueWords: string[]) => {
      this.blueGameWord = blueWords;
    });
    this.socket.on('/getRedTeamWord', (redWords: string[]) => {
      this.redGameWord = redWords;
    });
    this.socket.on('/getTime', (timerResponse: Timer) => {
      this.teamMoveColor = timerResponse.teamColor;
      if (this.teamName === timerResponse.teamColor) {
        this.time = timerResponse.time;
      } else {
        this.time = '01:00';
      }
    });
    this.GameService.isTeamMove.subscribe((v) => {
      this.isTeamMove = v;
    });
    this.socket.on('/getTeamEndTurn', (endTurnArray: colorOnCart[]) => {
      this.teamEndTurn = endTurnArray;
    });
    this.GameService.teamUsersRedCounter$.subscribe((v) => {
      this.teamUsersRedCounter = v;
    });

    this.GameService.teamUsersBlueCounter$.subscribe((v) => {
      this.teamUsersBlueCounter = v;
    });
  }

  ngOnDestroy(): void {
    this.mainUser$?.unsubscribe();
    this.usersArray$?.unsubscribe();
    this.masterWordsSubject$?.unsubscribe();
  }

  joinTeam() {
    if (this.user) {
      this.GameService.userIsMasterGetMasterWord$.next(false);
      this.UserService.changeUserRole(this.teamName, false);
    }
  }

  joinMaster() {
    if (this.user) {
      this.UserService.changeUserRole(`Master${this.teamName}`, true);
    }
  }

  addWords() {
    if (this.inputWord.length < 1) {
      return;
    }
    this.http
      .post(`${this.GameService.url}/addTeamWord`, {
        word: this.inputWord,
        team: this.teamName,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
    this.GameService.teamStartMove(this.teamName);
  }

  endTurn() {
    if ((this.user as User).role === (this.teamMoveColor as string)) {
      this.http
        .post(`${this.GameService.url}/endTurn`, {
          color: this.user?.color,
          user: this.user?.id,
        })
        .subscribe(
          () => {},
          (error) => {
            console.error('Error:', error);
          }
        );
      this.nextRound();
    }
  }

  isAllPlayersChoice() {
    if (this.teamMoveColor === 'red') {
      if ((this.teamUsersRedCounter as number) > 0) {
        if (this.teamEndTurn.length === this.teamUsersRedCounter) {
          return true;
        }
      }
    } else {
      if ((this.teamUsersBlueCounter as number) > 0) {
        if (this.teamEndTurn.length === this.teamUsersBlueCounter) {
          return true;
        }
      }
    }
    return false;
  }

  nextRound() {
    clearTimeout(this.roundTimeout);
    this.roundTimeout = setTimeout(() => {
      if (this.isAllPlayersChoice()) {
        this.GameService.changeIsTeamMove(false);
        this.GameService.teamStartMove(
          this.teamMoveColor === 'red' ? 'blue' : 'red'
        );
      }
    }, 1900);
  }
}
