import { Component, OnInit, ViewChild } from '@angular/core';

const SERVER_WSS = 'wss://192.168.10.66:8443';

const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

@Component({
  selector: 'app-simple',
  templateUrl: './simple.component.html',
  styleUrls: ['./simple.component.scss']
})
export class SimpleComponent implements OnInit {
  @ViewChild('localVideo') localVideo;
  @ViewChild('remoteVideo') remoteVideo;
  serverConnection: WebSocket;
  uuid: string;
  localStream: MediaStream;
  peerConnection;

  ngOnInit(): void {
    console.log(this.localVideo);
    console.log(this.remoteVideo);
    this.pageReady();
  }

  private startWebRtc() {
    this.start(true);
  }

  private start(isCaller) {
    this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
    this.peerConnection.onicecandidate = this.gotIceCandidate.bind(this);
    this.peerConnection.ontrack = this.gotRemoteStream.bind(this);
    this.peerConnection.addStream(this.localStream);

    if (isCaller) {
      this.peerConnection
        .createOffer()
        .then(this.createdDescription.bind(this))
        .catch(this.errorHandler.bind(this));
    }
  }

  private gotIceCandidate(event) {
    if (event.candidate != null) {
      this.serverConnection.send(
        JSON.stringify({ ice: event.candidate, uuid: this.uuid })
      );
    }
  }

  private pageReady() {
    this.uuid = this.createUUID();
    this.serverConnection = new WebSocket(SERVER_WSS);
    this.serverConnection.onmessage = this.gotMessageFromServer.bind(this);

    const constraints = {
      video: true,
      audio: true
    };

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(this.getUserMediaSuccess.bind(this))
        .catch(this.errorHandler.bind(this));
    } else {
      alert('Your browser does not support getUserMedia API');
    }
  }

  private toggleControls() {
    const video: HTMLVideoElement = this.localVideo.nativeElement;
    video.muted = !video.muted;
    video.controls = !video.controls;
    video.autoplay = !video.autoplay;
  }

  private getUserMediaSuccess(stream: MediaStream) {
    this.localStream = stream;
    this.localVideo.nativeElement.srcObject = stream;
  }

  private gotRemoteStream(event) {
    console.log('got remote stream');
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  private errorHandler(error) {
    console.log(error);
  }

  private gotMessageFromServer(message) {
    if (!this.peerConnection) {
      this.start(false);
    }

    const signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if (signal.uuid === this.uuid) {
      return;
    }

    if (signal.sdp) {
      this.peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          // Only create answers in response to offers
          if (signal.sdp.type === 'offer') {
            this.peerConnection
              .createAnswer()
              .then(this.createdDescription.bind(this))
              .catch(this.errorHandler.bind(this));
          }
        })
        .catch(this.errorHandler.bind(this));
    } else if (signal.ice) {
      this.peerConnection
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch(this.errorHandler.bind(this));
    }
  }

  private createdDescription(description) {
    console.log('got description');
    this.peerConnection
      .setLocalDescription(description)
      .then(() => {
        this.serverConnection.send(
          JSON.stringify({
            sdp: this.peerConnection.localDescription,
            uuid: this.uuid
          })
        );
      })
      .catch(this.errorHandler.bind(this));
  }

  private s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  private createUUID() {
    return (
      this.s4() +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      this.s4() +
      this.s4()
    );
  }
}
