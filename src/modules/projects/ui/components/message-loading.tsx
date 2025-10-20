import Image from "next/image";
import { useState, useEffect } from "react";


// This component displays a rotating list of loading messages to keep the user engaged 
const ShimmerMessages = () => {
  const messages = [
    "Thinking...",
    "Loading...",
    "Please wait...",
    "Generating code...",
    "Creating project...",
    "Building UI...",
    "Implementing logic...",
    "Adding functionality...",
    "Finalizing details...",
    "Almost done...",
    "Just a moment...",
    "Please wait...",
    "Loading...",
    "Generating code...",
    "Creating project...",
    "Building UI...",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cycle through loading messages every 2 seconds
  // This creates a rotating display of different loading states to keep the user engaged
  // the modulo operator ensures that the current message index wraps around to the beginning of the array when it reaches the end
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length); 
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2">
        <span className="text-base text-muted-foreground animate-pulse">
            {messages[currentMessageIndex]}
        </span>
    </div>
  )
};


export const MessageLoading = () => {
    return (
        <div className="flex flex-col group px-2 pb-4">
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                    src='/logo.svg'
                    alt="Joy"
                    width={18}
                    height={18}
                    className='shrink-0'                
                />
                <span className="text-sm font-medium">Joy</span>
            </div>
            <div className="pl-8.5 flex flex-col gap-y-4">
                <ShimmerMessages />
            </div>
        </div>
    )
}