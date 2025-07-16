// call/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useSearchParams } from "next/navigation";

export default function CallPage() {
  const searchParams = useSearchParams();

  const channelName = searchParams.get("channel");
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const callType = searchParams.get("type"); // "audio" or "video"

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!channelName || !token || !uid) return;

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    let localTrack: any;
    let localAudioTrack: any;

    const init = async () => {
      await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelName, token, uid);

      if (callType === "video") {
        localTrack = await AgoraRTC.createCameraVideoTrack();
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        await client.publish([localTrack, localAudioTrack]);

        localTrack.play(localVideoRef.current!);
      } else {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
      }

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          user.videoTrack?.play(remoteVideoRef.current!);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      setJoined(true);
    };

    init();

    return () => {
      if (localTrack) localTrack.stop();
      if (localAudioTrack) localAudioTrack.stop();
      client.leave();
    };
  }, [channelName, token, uid]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-xl font-bold mb-4">{callType?.toUpperCase()} CALL</h1>
      <div className="flex gap-4">
        {callType === "video" && (
          <div>
            <h2 className="text-sm text-gray-700 mb-1">Local Video</h2>
            <div ref={localVideoRef} className="w-64 h-48 bg-black" />
          </div>
        )}
        <div>
          <h2 className="text-sm text-gray-700 mb-1">Remote Video</h2>
          <div ref={remoteVideoRef} className="w-64 h-48 bg-black" />
        </div>
      </div>
    </div>
  );
}
