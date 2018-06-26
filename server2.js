var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 9090});
var users = {};

wss.on('connection', function(connection) {
   console.log("User connected");
   connection.on('message', function(message) {
      var data;
      try {
         data = JSON.parse(message);
      } catch (e) {
         console.log("Invalid JSON");
         data = {};
      }
      switch (data.type) {
         case "login":
            console.log("User logged", data.name);
            users[data.name] = connection;
            connection.name = data.name;
            sendTo(connection, {
               type: "login",
               success: true
            });
            break;

         case "offer":
            console.log("Sending offer to: ", data.name);
            var conn = users[data.name];
            if(conn != null) {
               connection.otherName = data.name;
               sendTo(conn, {
                  type: "offer",
                  offer: data.offer,
                  name: connection.name,
                  uuid: guid()
               });
            }
            break;

         case "answer":
            console.log("Sending answer to: ", data.name);
            var conn = users[data.name];
            if(conn != null) {
               connection.otherName = data.name;
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer
               });
            }
            break;

         case "candidate":
            console.log("Sending candidate to:",data.name);
            var conn = users[data.name];
            if(conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  candidate: data.candidate
               });
            }
            break;

         case "leave":
            console.log("Disconnecting from", data.name);
            var conn = users[data.name];
            if(conn != null) {
              conn.otherName = null;
              sendTo(conn, {
                type: "leave"
              });
            }
            break;

         default:
            sendTo(connection, {
               type: "error",
               message: "Command not found: " + data.type
            });

            break;
      }
   });

   connection.on("close", function() {
      if(connection.name) {
         delete users[connection.name];
         if(connection.otherName) {
            console.log("Disconnecting from ", connection.otherName);
            var conn = users[connection.otherName];
            if(conn != null) {
              conn.otherName = null;
              sendTo(conn, {
                type: "leave"
              });
            }
         }
      }

   });
});

function sendTo(connection, message) {
  console.log(message);
  connection.send(JSON.stringify(message));
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
