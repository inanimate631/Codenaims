import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MasterWords, Timer } from 'src/app/interface/Game.interface';
import { Socket } from 'ngx-socket-io';
import { User } from 'src/app/interface/User.interface';
import { wordsArrays } from './wordArrays';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  wordsSubject$ = new Subject<string[]>();

  url = 'https://codenames-server.onrender.com';

  masterWordsSubject$ = new Subject<MasterWords>();

  blueMasterWords: number[] = [];
  redMasterWords: number[] = [];
  blacMasterkWords: number = 0;

  time = '01:00';
  isTeamMoveTimer = false;
  isTeamMove = new Subject<boolean>();
  isTeamMoveResult: boolean = false;
  teamMoveColor = new Subject<string>();

  teamUsersRedCounter$ = new Subject<number>();
  teamUsersBlueCounter$ = new Subject<number>();

  userIsMasterGetMasterWord$ = new Subject<boolean>();

  gameEnd$ = new Subject<boolean>();

  teamColor: string | null = null;

  gamePause = false;

  gameDifficulty = 1;

  constructor(private http: HttpClient, private socket: Socket) {}

  init() {
    this.socket.on('/getIsTeamMoveTimer', (isTeamMoveTimer: boolean) => {
      this.isTeamMoveTimer = isTeamMoveTimer;
    });
    this.socket.on('/getIsTeamMove', (isTeamMove: boolean) => {
      this.isTeamMove.next(isTeamMove);
    });
    this.isTeamMove.subscribe((v) => {
      this.isTeamMoveResult = v;
    });
    this.socket.on('/getTime', (timerResponse: Timer) => {
      this.time = timerResponse.time;
      if (
        timerResponse.time === '0:00' &&
        !this.isTeamMoveResult &&
        !this.isTeamMoveTimer
      ) {
        this.createTimer(this.teamColor === 'blue' ? 'red' : 'blue', '01:00');
        this.changeisTeamMoveTimer(true);
      }
      if (timerResponse.time === '0:00' && this.isTeamMoveTimer) {
        this.teamStartMove(this.teamColor as string);
      }
    });
    this.socket.on('/getTeamMoveColor', (color: string) => {
      this.teamMoveColor.next(color);
      this.teamColor = color;
    });
    this.socket.on('/getMasterWords', (masterWords: MasterWords) => {
      this.blueMasterWords = masterWords.blueWords;
      this.redMasterWords = masterWords.redWords;
      this.blacMasterkWords = masterWords.blackWords;
      this.masterWordsSubject$.next(masterWords);
    });
    this.socket.on('connectedUsersUpdated', (users: User[]) => {
      let redCounter = 0;
      let blueCounter = 0;
      users.forEach((user) => {
        if (user.role === 'red') {
          redCounter++;
        } else if (user.role === 'blue') {
          blueCounter++;
        } else {
          return;
        }
      });
      this.teamUsersRedCounter$.next(redCounter);
      this.teamUsersBlueCounter$.next(blueCounter);
    });

    this.socket.on('/getIsGameEnd', (isGameEnd: boolean) => {
      this.gameEnd$.next(isGameEnd);
    });
  }

  createWordsPack() {
    return new Promise((resolve, reject) => {
      const words: string[] = [];
      const topics: number[] = [];
      let wordsNumOfTopic = 2;

      while (words.length < 25) {
        let wordsLength;
        if (this.gameDifficulty === 0) {
          wordsLength = words.length - 5;
          wordsNumOfTopic = 4;
        } else if (this.gameDifficulty === 2) {
          wordsLength = words.length + 10;
        } else {
          wordsLength = words.length;
        }
        if (wordsLength < 15) {
          const length = words.length;
          let randomPack = this.random(wordsArrays[this.gameDifficulty].length);
          while (topics.includes(randomPack)) {
            randomPack = this.random(wordsArrays[this.gameDifficulty].length);
          }
          topics.push(randomPack);
          while (words.length < length + wordsNumOfTopic) {
            let word =
              wordsArrays[this.gameDifficulty][randomPack][
                this.random(wordsArrays[this.gameDifficulty][randomPack].length)
              ];
            if (!words.includes(word)) {
              words.push(word);
            }
          }
        } else if (wordsLength >= 15) {
          let word =
            wordsArrays[this.gameDifficulty][
              wordsArrays[this.gameDifficulty].length - 1
            ][
              this.random(
                wordsArrays[this.gameDifficulty][
                  wordsArrays[this.gameDifficulty].length - 1
                ].length
              )
            ];
          if (!words.includes(word)) {
            words.push(word);
          }
        }
      }
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }

      this.http.post(`${this.url}/wordArray`, [...words]).subscribe(
        () => {
          resolve(true);
        },
        (error) => {
          console.error('Error:', error);
          reject(error);
        }
      );
    });
  }

  createMasterWords() {
    let blueWords: number[] = [];
    let redWords: number[] = [];
    let blackWords: number = 0;

    while (blueWords.length < 9) {
      const num = this.random(25);
      if (!blueWords.includes(num)) blueWords.push(num);
    }
    while (redWords.length < 9) {
      const num = this.random(25);
      if (!blueWords.includes(num) && !redWords.includes(num)) {
        redWords.push(num);
      }
    }
    let num = this.random(25);
    while (blueWords.includes(num) || redWords.includes(num)) {
      num = this.random(25);
    }
    blackWords = num;

    this.blueMasterWords = blueWords;
    this.redMasterWords = redWords;
    this.blacMasterkWords = blackWords;

    this.http
      .post(`${this.url}/setMasterWord`, {
        blackWords: blackWords,
        redWords: redWords,
        blueWords: blueWords,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
  }

  move(colorTeam: string, time: string, id?: number) {
    if (id) {
      if (colorTeam === 'red') {
        this.redMasterWords = this.redMasterWords.filter((v) => v !== id);
      } else if (colorTeam === 'blue') {
        this.blueMasterWords = this.blueMasterWords.filter((v) => v !== id);
      }
    } else {
      if (colorTeam === 'red') {
        this.redMasterWords.splice(0, 1);
      } else if (colorTeam === 'blue') {
        this.blueMasterWords.splice(0, 1);
      }
    }

    this.http
      .post(`${this.url}/setMasterWord`, {
        blackWords: this.blacMasterkWords,
        redWords: this.redMasterWords,
        blueWords: this.blueMasterWords,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
    this.http
      .post(`${this.url}/changeTeamMoveColor`, {
        color: colorTeam,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
    if (id) {
      this.createTimer(colorTeam === 'red' ? 'blue' : 'red', time);
    } else {
      this.createTimer(colorTeam, time);
    }
    this.changeIsTeamMove(false);
  }

  createTimer(colorTeam: string, time?: string) {
    if (!this.isTeamMoveTimer && time) {
      this.time = time;
    }
    if (this.gamePause) {
      return;
    }
    this.http
      .post(`${this.url}/setTime`, {
        time: this.time,
        teamColor: colorTeam === 'red' ? 'blue' : 'red',
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
  }

  teamStartMove(color: string) {
    this.http
      .post(`${this.url}/changeTeamMoveColor`, { color: color })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
    this.createTimer(color === 'red' ? 'blue' : 'red', '01:00');
  }

  correctMove(id: number, colorTeam: string) {
    if (colorTeam === 'red') {
      this.redMasterWords = this.redMasterWords.filter((v) => v !== id);
    } else if (colorTeam === 'blue') {
      this.blueMasterWords = this.blueMasterWords.filter((v) => v !== id);
    }
    this.http
      .post(`${this.url}/setMasterWord`, {
        blackWords: this.blacMasterkWords,
        redWords: this.redMasterWords,
        blueWords: this.blueMasterWords,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );

    let min = +this.time.split(':')[0];
    let sec = +this.time.split(':')[1];
    sec += 20;
    if (sec >= 60) {
      min += 1;
      sec -= 60;
    }
    this.createTimer(
      colorTeam === 'red' ? 'blue' : 'red',
      `0${min}:${sec > 0 ? sec : '0' + sec}`
    );
  }

  async setWordsShowed(id: number) {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.url}/setWordsShowed`, { id: id }).subscribe(
        () => {
          resolve(true);
        },
        (error) => {
          console.error('Error:', error);
          reject(error);
        }
      );
    });
  }

  changeIsTeamMove(isTeamMove: boolean) {
    this.http
      .post(`${this.url}/setIsTeamMove`, { isTeamMove: isTeamMove })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
  }

  gameEnd(team: string) {
    this.createTimer(team, '00:00');
    this.http.post(`${this.url}/isGameEnd`, { isGameEnd: true }).subscribe(
      () => {},
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  changeisTeamMoveTimer(isTeamMoveTimer: boolean) {
    this.http
      .post(`${this.url}/setIsTeamMoveTimer`, {
        isTeamMoveTimer: isTeamMoveTimer,
      })
      .subscribe(
        () => {},
        (error) => {
          console.error('Error:', error);
        }
      );
  }

  stopTimer() {
    this.http.post(`${this.url}/clearTime`, { clearTimer: true }).subscribe(
      () => {},
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  random(max: number) {
    return Math.floor(Math.random() * max);
  }
}
