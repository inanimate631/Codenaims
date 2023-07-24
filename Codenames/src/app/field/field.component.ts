import { Component, OnDestroy, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { GameService } from './../services/game/game.service';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectMainUser } from '../state/selectors';
import { User } from '../interface/User.interface';
import { HttpClient } from '@angular/common/http';
import {
  MasterWords,
  WordsShowed,
  colorOnCart,
} from '../interface/Game.interface';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
})
export class FieldComponent implements OnInit, OnDestroy {
  words: string[] = [];
  user: User | null = null;
  masterWordsSubject$: Subscription | null = null;
  mainUser$: Subscription | null = null;

  blueWords: number[] = [];
  redWords: number[] = [];
  whiteWord: number[] = [];
  blackWords: number | null = null;

  clickedWord: number | null = null;
  teamMoveColor: string | null = null;

  teamMoveColor$: Subscription | null = null;
  teamUsersRedCounter = 0;
  teamUsersBlueCounter = 0;

  selectCart: colorOnCart[] = [];

  masterWordsObj: MasterWords | null = null;

  wordsShowed: WordsShowed | null = null;

  wordtimeout: any;

  isTeamMove: boolean = false;

  mainUserClickOn: number | null = null;

  masterWord: any;

  userIsMasterGetMasterWord: boolean = false;

  constructor(
    private socket: Socket,
    private GameService: GameService,
    private store: Store,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.GameService.userIsMasterGetMasterWord$.subscribe((v) => {
      this.userIsMasterGetMasterWord = v;
    });
    this.socket.on('/getWordArray', (wordArray: string[]) => {
      this.words = wordArray;
      this.blueWords = [];
      this.blackWords = null;
      this.redWords = [];
      this.whiteWord = [];
      this.GameService.isTeamMove.next(false);
    });

    this.socket.on('/getClicksWord', (wordsIndex: number) => {
      if (this.words.length > 0) {
        this.animOnWord(wordsIndex);
      }
    });

    this.mainUser$ = (
      this.store.select(selectMainUser) as Observable<User>
    ).subscribe((user) => {
      this.user = user;
    });

    this.masterWordsSubject$ = this.GameService.masterWordsSubject$.subscribe(
      (v) => {
        if (this.user?.isMaster) {
          if (!this.userIsMasterGetMasterWord) {
            this.blueWords = v.blueWords;
            this.blackWords = v.blackWords;
            this.redWords = v.redWords;
            this.GameService.userIsMasterGetMasterWord$.next(true);
          }
        }
        this.masterWordsObj = {
          blueWords: v.blueWords,
          redWords: v.redWords,
          blackWords: v.blackWords,
        };
      }
    );

    this.teamMoveColor$ = this.GameService.teamMoveColor.subscribe((v) => {
      this.teamMoveColor = v as string;
    });

    this.GameService.teamUsersRedCounter$.subscribe((v) => {
      this.teamUsersRedCounter = v;
    });

    this.GameService.teamUsersBlueCounter$.subscribe((v) => {
      this.teamUsersBlueCounter = v;
    });

    this.socket.on('/getCartSelected', (selectCart: colorOnCart[]) => {
      this.selectCart = selectCart;
      if (this.user?.isMaster) {
        this.masterAnim();
      }
    });

    this.socket.on('/getWordsShowed', (wordsShowed: WordsShowed) => {
      this.wordsShowed = wordsShowed;
      console.log(wordsShowed)
      if (!this.user?.isMaster) {
        this.blueWords = wordsShowed.blueWords;
        this.redWords = wordsShowed.redWords;
        this.whiteWord = wordsShowed.whiteWords;
        this.blackWords = wordsShowed.blackWords;
      } else {
        this.blueWords.push(...wordsShowed.blueWords);
        this.redWords.push(...wordsShowed.redWords);
      }
    });

    this.GameService.isTeamMove.subscribe((v) => {
      this.isTeamMove = v;
    });
  }

  ngOnDestroy(): void {
    this.masterWordsSubject$?.unsubscribe();
    this.teamMoveColor$?.unsubscribe();
    this.mainUser$?.unsubscribe();
  }

  clickOnWord(i: number) {
    if (this.user?.role === 'Masterblue' || this.user?.role === 'Masterred') {
      return;
    } else if (this.user?.role === this.teamMoveColor) {
      if (
        this.redWords.includes(i) ||
        this.blueWords.includes(i) ||
        this.whiteWord.includes(i) ||
        !this.isTeamMove
      ) {
        this.http
          .post(`${this.GameService.url}/clickOnWord`, { value: i })
          .subscribe(
            () => {},
            (error) => {
              console.error('Error:', error);
            }
          );
      } else {
        if (i === this.mainUserClickOn) {
          this.http
            .post(`${this.GameService.url}/userDeletedPointerOnCart`, {
              id: i,
            })
            .subscribe(
              () => {},
              (error) => {
                console.error('Error:', error);
              }
            );
          this.mainUserClickOn = null;
        } else {
          this.http
            .post(`${this.GameService.url}/userSelectCart`, {
              cartId: i,
              color: this.user.color,
              userId: this.user.id,
            })
            .subscribe(
              () => {},
              (error) => {
                console.error('Error:', error);
              }
            );
          this.mainUserClickOn = i;
          this.showWord(i);
        }
      }
    } else {
      this.http
        .post(`${this.GameService.url}/clickOnWord`, { value: i })
        .subscribe(
          () => {},
          (error) => {
            console.error('Error:', error);
          }
        );
    }
  }

  isIdInSelectCart(id: number): boolean {
    if (
      this.redWords.includes(id) ||
      this.blueWords.includes(id) ||
      this.whiteWord.includes(id) ||
      !this.isTeamMove
    ) {
      return false;
    }
    return this.selectCart.some((item) => item.id === id);
  }

  isAllPlayersChoice(id: number): boolean {
    if (
      this.redWords.includes(id) ||
      this.blueWords.includes(id) ||
      this.whiteWord.includes(id) ||
      !this.isTeamMove
    ) {
      return false;
    }
    if (this.teamMoveColor === 'red') {
      if (this.teamUsersRedCounter === 0) {
        return false;
      } else if (this.selectCart.length === this.teamUsersRedCounter) {
        return this.selectCart.every((item) => item.id === id);
      } else {
        return false;
      }
    } else if (this.teamMoveColor === 'blue') {
      if (this.teamUsersBlueCounter === 0) {
        return false;
      } else if (this.selectCart.length === this.teamUsersBlueCounter) {
        return this.selectCart.every((item) => item.id === id);
      } else {
        return false;
      }
    }
    return false;
  }

  animOnWord(i: number) {
    this.clickedWord = i;
    setTimeout(() => {
      this.clickedWord = null;
    }, 400);
  }

  showWord(id: number) {
    clearTimeout(this.wordtimeout);
    this.wordtimeout = setTimeout(() => {
      if (!this.isAllPlayersChoice(id)) {
        return;
      }
      this.GameService.setWordsShowed(id);
      if (
        this.masterWordsObj?.redWords.includes(id) &&
        !this.redWords.includes(id)
      ) {
        this.redWords.push(id);
        if (this.teamMoveColor === 'red') {
          this.GameService.correctMove(id, this.teamMoveColor as string);
        } else {
          this.GameService.move('red', '01:00', id);
        }
        this.selectCart = [];
      } else if (
        this.masterWordsObj?.blueWords.includes(id) &&
        !this.blueWords.includes(id)
      ) {
        this.blueWords.push(id);
        if (this.teamMoveColor === 'blue') {
          this.GameService.correctMove(id, this.teamMoveColor as string);
        } else {
          this.GameService.move('blue', '01:00', id);
        }
        this.selectCart = [];
      } else if (this.masterWordsObj?.blackWords === id) {
        this.blackWords = id;
        this.GameService.gameEnd(this.teamMoveColor as string);
      } else {
        this.whiteWord.push(id);
        this.GameService.move(
          this.teamMoveColor === 'red' ? 'blue' : 'red',
          '01:00',
          id
        );
        this.selectCart = [];
        return;
      }
    }, 2000);
  }

  masterAnim() {
    clearTimeout(this.masterWord);
    this.masterWord = setTimeout(() => {
      this.selectCart = [];
    }, 2000);
  }

  isShowed(id: number) {
    if (this.user?.isMaster) {
      if (
        this.wordsShowed?.blueWords.includes(id) ||
        this.wordsShowed?.redWords.includes(id)
      ) {
        return true;
      }
    }
    return false;
  }
}
