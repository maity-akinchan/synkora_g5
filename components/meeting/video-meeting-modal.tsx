"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoMeeting } from "@/components/meeting/video-meeting";

interface VideoMeetingModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

export function VideoMeetingModal({
    open,
    onClose,
    projectId,
    projectName,
}: VideoMeetingModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 dark:bg-gray-950 dark:border-gray-800">
                <DialogHeader className="p-4 border-b dark:border-gray-800">
                    <DialogTitle className="text-foreground">
                        {projectName} - Team Meeting
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 h-[calc(95vh-80px)]">
                    <VideoMeeting
                        projectId={projectId}
                        projectName={projectName}
                        onLeave={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
