import { StoreModule } from '@ngrx/store';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { TeamComponent } from './team/team.component';
import { FieldComponent } from './field/field.component';
import { NewPlayerComponent } from './new-player/new-player.component';
import { FormsModule } from '@angular/forms';
import { userReducers } from './state/reducers';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GameComponent } from './game/game.component';
import { SocketIoModule } from 'ngx-socket-io';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const config = {
  url: 'http://localhost:5000',
  options: {},
};

@NgModule({
  declarations: [
    AppComponent,
    TeamComponent,
    FieldComponent,
    NewPlayerComponent,
    GameComponent,
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    StoreModule.forRoot({ Users: userReducers }),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
    }),
    SocketIoModule.forRoot(config),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
