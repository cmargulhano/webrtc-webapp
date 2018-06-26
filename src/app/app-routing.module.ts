import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimpleComponent } from './ui/webrtc/simple/simple.component';
import { VideoCallComponent } from './ui/webrtc/video-call/video-call.component';
import { HomeComponent } from './ui/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: '/video-call', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'v1', component: SimpleComponent },
  { path: 'v2', component: VideoCallComponent },
  { path: 'video-call', component: VideoCallComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
