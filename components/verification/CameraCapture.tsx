"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const confirm = () => {
        if (!imgSrc) return;

        // Convert base64 to File
        fetch(imgSrc)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                onCapture(file);
            });
    };

    return (
        <div className="flex flex-col items-center space-y-4 w-full h-full">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/20 shadow-inner">
                {imgSrc ? (
                    <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex items-center gap-4">
                {!imgSrc ? (
                    <>
                        <Button variant="outline" onClick={onCancel} className="bg-transparent border-white/20 text-white hover:bg-white/10">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={capture} className="bg-gold-500 text-black hover:bg-gold-400 font-bold px-8">
                            <Camera className="w-5 h-5 mr-2" />
                            Capture
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onClick={retake} className="bg-transparent border-white/20 text-white hover:bg-white/10">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retake
                        </Button>
                        <Button onClick={confirm} className="bg-green-500 text-black hover:bg-green-400 font-bold px-8">
                            <Check className="w-5 h-5 mr-2" />
                            Use Photo
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
