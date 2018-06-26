import { Component, OnInit, ViewChild } from '@angular/core';

const constraints = {
  video: true,
  audio: true
};

// using Google public stun server
const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const WEBSOCKET_SERVER = 'ws://192.168.10.66:9090';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit {
  showVideo: boolean;
  showLogin: boolean;
  @ViewChild('localVideo') localVideo: HTMLVideoElement;
  @ViewChild('remoteVideo') remoteVideo: HTMLVideoElement;
  connectedUser: string;
  localUser = 'conciergXXX';
  remoteUser = 'stationXXX';
  webSocketConnection: WebSocket;
  peerConnection: RTCPeerConnection;
  isClosed: boolean;

  constructor() {}

  ngOnInit() {
    this.showVideo = false;
    this.showLogin = true;
    this.handleSignalingServerMessages();
  }

  handleSignalingServerMessages() {
    // connecting to our signaling server
    this.webSocketConnection = new WebSocket(WEBSOCKET_SERVER);
    this.webSocketConnection.onclose = () => {
      console.log('Closed signaling server');
      this.showVideo = false;
      this.showLogin = true;
      this.isClosed = true;
    };
    this.webSocketConnection.onopen = () => {
      console.log('Connected to the signaling server');
      this.isClosed = false;
      this.login();
    };
    // when we got a message from a signaling server
    this.webSocketConnection.onmessage = msg => {
      // console.log('Got message', msg.data);
      const data = JSON.parse(msg.data);
      switch (data.type) {
        case 'login':
          this.handleLogin(data.success);
          break;
        // when somebody wants to call us
        case 'offer':
          this.handleOffer(data.offer, data.name);
          break;
        case 'answer':
          this.handleAnswer(data.answer);
          break;
        // when a remote peer sends an ice candidate to us
        case 'candidate':
          this.handleCandidate(data.candidate);
          break;
        case 'leave':
          this.handleLeave();
          break;
        default:
          break;
      }
    };
    this.webSocketConnection.onerror = err => {
      console.log('Got error', err);
    };
  }

  waitForWebsocketConnection() {
    return new Promise((resolve) => {
      this.webSocketConnection.onopen = () => {
        resolve();
        this.isClosed = false;
      };
    });
  }

  login() {
    if (this.isClosed) {
      this.handleSignalingServerMessages();
      this.waitForWebsocketConnection().then(() => {
        this.doLogin();
      });
    } else {
      if (this.localUser.length > 0) {
        this.doLogin();
      }
    }
  }

  private doLogin() {
    if (this.localUser.length > 0) {
      this.send({
        type: 'login',
        name: this.localUser
      });
    }
  }

  call() {
    if (this.remoteUser.length > 0) {
      this.connectedUser = this.remoteUser;
      // create an offer
      this.peerConnection
        .createOffer()
        .then(offer => {
          this.send({
            type: 'offer',
            offer: offer
          });
          this.peerConnection.setLocalDescription(offer);
        })
        .catch(error => {
          alert('Error when creating an offer');
        });
    }
  }

  hangUp() {
    this.send({
      type: 'leave'
    });
    this.handleLeave();
  }

  // alias for sending JSON encoded messages
  send(message) {
    // attach the other peer username to our messages
    if (this.connectedUser) {
      message.name = this.connectedUser;
    }
    this.webSocketConnection.send(JSON.stringify(message));
  }

  handleLogin(success) {
    if (success === false) {
      alert('Ooops...try a different username');
      this.showLogin = true;
    } else {
      this.showVideo = true;
      this.showLogin = false;
      // Starting a peer connection
      // getting local video stream
      if (navigator.mediaDevices.getUserMedia) {
        navigator.getUserMedia(
          constraints,
          stream => {
            // displaying local video stream on the page
            this.localVideo['nativeElement'].srcObject = stream;
            this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
            // setup stream listening
            this.peerConnection.addStream(stream);
            // when a remote user adds stream to the peer connection, we display it
            this.peerConnection.onaddstream = e => {
              this.remoteVideo['nativeElement'].srcObject = e.stream;
            };
            // Setup ice handling
            this.peerConnection.onicecandidate = event => {
              if (event.candidate) {
                this.send({
                  type: 'candidate',
                  candidate: event.candidate
                });
              }
            };
          },
          error => {
            console.log(error);
          }
        );
      } else {
        alert('Your browser does not support getUserMedia API');
      }
    }
  }

  // when somebody sends us an offer
  handleOffer(offer, name) {
    this.connectedUser = name;
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    // create an answer to an offer
    this.peerConnection
      .createAnswer()
      .then(answer => {
        this.peerConnection.setLocalDescription(answer);
        this.send({
          type: 'answer',
          answer: answer
        });
      })
      .catch(error => {
        alert('Error when creating an answer');
      });
  }

  // when we got an answer from a remote user
  handleAnswer(answer) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
  // when we got an ice candidate from a remote user
  handleCandidate(candidate) {
    this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  handleLeave() {
    this.connectedUser = null;
    this.remoteVideo.src = null;
    this.peerConnection.close();
    this.peerConnection.onicecandidate = null;
    this.peerConnection.onaddstream = null;
    setTimeout(() => {
      this.webSocketConnection.close();
      this.handleSignalingServerMessages();
      this.waitForWebsocketConnection().then(() => {
        this.doLogin();
      });
    }, 100);
  }
}
