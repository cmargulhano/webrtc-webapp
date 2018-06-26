import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { SimpleComponent } from './ui/webrtc/simple/simple.component';
import { AppRoutingModule } from './app-routing.module';
import { VideoCallComponent } from './ui/webrtc/video-call/video-call.component';
import { HomeComponent } from './ui/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    SimpleComponent,
    VideoCallComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
