import { UserService } from '../services/user/user.service';
import { Component } from '@angular/core';
import { User } from '../interface/User.interface';
import { Store } from '@ngrx/store';
import { selectMainUser, selectUsersArray } from '../state/selectors';

@Component({
  selector: 'app-new-player',
  templateUrl: './new-player.component.html',
  styleUrls: ['./new-player.component.scss'],
})
export class NewPlayerComponent {
  user: User = {
    id: '0',
    name: 'NIKPOMEN9i',
    color: '#fff',
    isMaster: false,
    role: 'Spectators',
    isAdmin: false,
  };
  name: string = '';
  usersArray: User[] = [];

  constructor(public UserService: UserService, private store: Store) {}

  ngOnInit(): void {
    this.UserService.initialize();
    this.store.select(selectMainUser).subscribe((user) => {
      if (user) {
        this.user = user;
        this.name = user.name;
      }
    });
    this.store.select(selectUsersArray).subscribe((users) => {
      if (users) {
        this.usersArray = [];
        users.forEach((user) => {
          if (user.role === 'Spectators') {
            this.usersArray.push(user);
          }
        });
      }
    });
  }
}
