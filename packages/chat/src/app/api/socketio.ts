import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    console.log("*First use, starting socket.io");

    const httpServer: NetServer = (res.socket as any).server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socketio",
    });

    io.on("connection", (socket) => {
      console.log("New client connected");

      socket.on("startProcess", (data) => {
        console.log("Starting process", data);

        // Simulate a process with updates
        socket.emit("update", "Process started");

        setTimeout(() => {
          socket.emit("update", "Processing...");
        }, 1000);

        setTimeout(() => {
          socket.emit("complete", {
            result: "Process completed",
            data: data.message,
          });
        }, 2000);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
    (res.socket as any).server.io = io;
  }
  res.end();
};

export default ioHandler;
