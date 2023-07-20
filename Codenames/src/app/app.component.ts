import { Component, OnInit } from '@angular/core';
import { GameService } from './services/game/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Codenames';
  isGameEnd = false;

  constructor(private GameService: GameService) {}

  ngOnInit(): void {
    this.GameService.gameEnd$.subscribe((v) => {
      this.isGameEnd = v;
    });
  }
}
