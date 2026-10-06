import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";

let socket: Socket | null = null;

export function useSocket(token: string | null) {
  const dispatch = useDispatch();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!token || connectedRef.current) return;

    socket = io("/", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      connectedRef.current = true;
    });

    socket.on("timetable:update", (data: { event: string; classId: string }) => {
      dispatch(
        addToast({
          type: "info",
          message: `Timetable updated for your class (${data.event})`,
        })
      );
    });

    socket.on("timetable:generated", () => {
      dispatch(addToast({ type: "success", message: "New timetable generated!" }));
    });

    socket.on("disconnect", () => {
      connectedRef.current = false;
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connectedRef.current = false;
    };
  }, [token, dispatch]);

  return socket;
}
