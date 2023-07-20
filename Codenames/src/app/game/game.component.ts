import { Component, OnInit } from '@angular/core';
import { GameService } from '../services/game/game.service';
import { Socket } from 'ngx-socket-io';
import { selectMainUser } from '../state/selectors';
import { Observable, Subscription } from 'rxjs';
import { User } from '../interface/User.interface';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  btnName = 'Start game';
  isAdmin = true;
  mainUser$!: Subscription;
  user: User | null = null;
  isGamePause: boolean = false;
  selected = '1';
  showBlock = false;

  constructor(
    private gameService: GameService,
    private socket: Socket,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.gameService.init();
    this.mainUser$ = (
      this.store.select(selectMainUser) as Observable<User>
    ).subscribe((user) => {
      this.user = user;
    });

    this.socket.on('/getWordArray', (wordArray: string[]) => {
      if (wordArray.length > 0) {
        this.btnName = 'Restart game';
      }
      this.gameService.userIsMasterGetMasterWord$.next(false);
    });

    this.socket.on('/getIsGamePause', (isGamePause: boolean) => {
      this.isGamePause = isGamePause;
    });
  }

  gameStart() {
    this.gameService.createMasterWords();
    this.gameService.createWordsPack();
    this.gameService.move(['red', 'blue'][this.gameService.random(2)], '02:00');
    this.btnName = 'Restart game';
  }

  gamePause() {
    if (!this.isGamePause) {
      this.gameService.gamePause = true;
      this.gameService.stopTimer();
    } else {
      this.gameService.gamePause = false;
      this.gameService.createTimer(this.gameService.teamColor as string);
    }
  }

  onSelectChange(event: any) {
    this.gameService.gameDifficulty = +this.selected;
  }
}
