"use client";

import { useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth } from "@/hooks/use-auth";

interface VideoMeetingProps {
    projectId: string;
    projectName: string;
    onLeave?: () => void;
}

export function VideoMeeting({ projectId, projectName, onLeave }: VideoMeetingProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!containerRef.current || !user) return;

        const initMeeting = async () => {
            // ZegoCloud credentials
            const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
            const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";

            if (!appID || !serverSecret) {
                console.error("ZegoCloud credentials not configured");
                return;
            }

            // Generate unique room ID based on project
            const roomID = `project-${projectId}`;

            // Generate user token
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                roomID,
                user.id,
                user.name || user.email || "User"
            );

            // Create instance
            const zp = ZegoUIKitPrebuilt.create(kitToken);

            // Start the call
            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.GroupCall,
                },
                turnOnMicrophoneWhenJoining: false,
                turnOnCameraWhenJoining: false,
                showMyCameraToggleButton: true,
                showMyMicrophoneToggleButton: true,
                showAudioVideoSettingsButton: true,
                showScreenSharingButton: true,
                showTextChat: true,
                showUserList: true,
                maxUsers: 50,
                layout: "Auto",
                showLayoutButton: true,
                onLeaveRoom: () => {
                    if (onLeave) {
                        onLeave();
                    }
                },
            });
        };

        initMeeting();
    }, [projectId, user, onLeave]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
        />
    );
}
