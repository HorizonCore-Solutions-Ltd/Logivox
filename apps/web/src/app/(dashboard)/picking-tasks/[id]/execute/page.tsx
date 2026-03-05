"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Keyboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  taskNumber: string;
  title: string;
  taskType: string;
  priority: string;
  status: string;
  inventoryItem?: {
    id: string;
    sku: string;
    name: string;
    imageUrl?: string;
  };
  quantity?: number;
  fromLocation?: {
    name: string;
    zone?: string;
    aisle?: string;
  };
  toLocation?: {
    name: string;
  };
}

interface VoiceMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
  intent?: string;
}

export default function VoicePickingExecutePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [mode, setMode] = useState<"VISUAL_ASSIST" | "EYES_FREE">("VISUAL_ASSIST");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize: Load Task & Speak Instruction
  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      // Mocking task fetch for now as the API might be generic
      const res = await fetch(`/api/picking-tasks/${params.id}`);
      if (!res.ok) throw new Error("Failed to load task");
      const data = await res.json();
      setTask(data);

      // Initial Voice Greeting
      if (data) {
        speak(`Task loaded. Pick ${data.quantity || 1} of ${data.inventoryItem?.sku || "item"}. Location: ${data.fromLocation?.name || "unassigned"}.`);
        addMessage("system", `Pick ${data.quantity || 1} of ${data.inventoryItem?.sku}. Location: ${data.fromLocation?.name}.`);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (role: "user" | "system", content: string, intent?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        role,
        content,
        timestamp: new Date(),
        intent,
      },
    ]);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Construct a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.1; // Slightly faster for efficiency
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice commands.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob); // Voice Engine expects "file"
      formData.append("sessionId", params.id); // Use task ID as session context
      
      // Send to our new unified Voice API
      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Voice processing failed");

      const result = await res.json();
      
      // 1. Show User Transcript
      addMessage("user", result.recognizedText || "(Unintelligible)");
      
      // 2. Show System Response
      if (result.responseText) {
        addMessage("system", result.responseText, result.intent);
        speak(result.responseText);
      }

      // 3. Handle specific intents (Client-side logic)
      if (result.intent === "CONFIRM" || result.intent === "PICK") {
        try {
          // Call the actual completion API
          const completeRes = await fetch(`/api/picking-tasks/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED" }),
          });

          if (completeRes.ok) {
            toast({ title: "Success", description: "Task marked as completed." });
            speak("Task completed. Good job.");
            setTimeout(() => router.push("/picking-tasks"), 1500);
          } else {
            toast({
              title: "Error",
              description: "Failed to update task status.",
              variant: "destructive",
            });
            speak("Error updating task. Please try again.");
          }
        } catch (e) {
          console.error(e);
          speak("Network error. Please try again.");
        }
      } else if (result.intent === "SHORT_PICK") {
          speak("Short pick recorded. How many did you find?");
          addMessage("system", "Short pick recorded. Please confirm actual quantity.");
      } else if (result.intent === "CHECK_DIGIT_OVERRIDE") {
          speak("Override authorized. Please proceed.");
          addMessage("system", "Check digit override authorized.");
      }
    } catch (error) {
      console.error(error);
      addMessage("system", "Sorry, I didn't catch that. Please try again.");
      speak("Sorry, please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Mode
  const toggleMode = () => {
    const newMode = mode === "VISUAL_ASSIST" ? "EYES_FREE" : "VISUAL_ASSIST";
    setMode(newMode);
    toast({
      title: `Switched to ${newMode === "EYES_FREE" ? "Eyes-Free Mode" : "Visual Assist Mode"}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Task Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${mode === "EYES_FREE" ? "bg-black text-white" : "bg-gray-50 text-slate-900"}`}>
      
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b bg-white dark:bg-black">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <h1 className="font-bold text-lg">{task.taskNumber}</h1>
          <Badge variant={task.priority === "URGENT" ? "destructive" : "secondary"}>
            {task.priority}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMode}>
          {mode === "VISUAL_ASSIST" ? <MicOff className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 gap-6 max-w-md mx-auto w-full">
        
        {/* Picking Card - Dominant UI Element */}
        <Card className={`overflow-hidden shadow-lg border-2 ${mode === "EYES_FREE" ? "border-gray-800 bg-gray-900 text-white" : "border-primary/20"}`}>
          <div className="h-48 bg-gray-100 flex items-center justify-center relative">
            {task.inventoryItem?.imageUrl ? (
              <img 
                src={task.inventoryItem.imageUrl} 
                alt={task.inventoryItem.name} 
                className="h-full w-full object-cover"
              />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <span className="text-6xl font-black opacity-20">IMG</span>
                    <span className="text-sm mt-2">No Image Available</span>
                </div>
            )}
            
            {/* Quantity Overlay */}
            <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-6 py-2 rounded-full text-2xl font-bold shadow-xl">
              x{task.quantity || 1}
            </div>
          </div>

          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              {task.fromLocation?.name || "Unknown Location"}
            </CardTitle>
            <p className="text-center text-lg text-muted-foreground mt-1">
              {task.inventoryItem?.sku} - {task.inventoryItem?.name}
            </p>
          </CardHeader>
          
          {mode === "VISUAL_ASSIST" && (
            <CardContent>
               <div className="grid grid-cols-2 gap-4 mt-2">
                 <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                   <span className="text-xs text-blue-600 block uppercase tracking-wide">Category</span>
                   <span className="font-semibold text-blue-900">Electronics</span>
                 </div>
                 <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                    <span className="text-xs text-amber-600 block uppercase tracking-wide">Weight</span>
                    <span className="font-semibold text-amber-900">1.2 kg</span>
                 </div>
               </div>
            </CardContent>
          )}

          <CardFooter className="flex gap-2 justify-center pb-6">
            <Button 
              size="lg" 
              className={`rounded-full h-16 w-16 shadow-xl transition-all ${isListening ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" : "bg-primary hover:bg-primary/90"}`}
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
            >
              {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Conversation Transcript (Chat) */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 min-h-[200px]">
           {messages.length === 0 && (
             <div className="text-center text-muted-foreground py-8">
               <p>Tap and hold Mic to speak.</p>
               <p className="text-sm mt-2 italic">"Pick 5 confirmed"</p>
             </div>
           )}
           {messages.map((msg) => (
             <div 
               key={msg.id} 
               className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
             >
               <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                 msg.role === "user" 
                   ? "bg-primary text-primary-foreground rounded-br-none" 
                   : "bg-white border rounded-bl-none text-gray-800"
               }`}>
                 {msg.intent && (
                    <span className="block text-[10px] uppercase font-bold opacity-70 mb-1">{msg.intent.replace("_", " ")}</span>
                 )}
                 {msg.content}
               </div>
             </div>
           ))}
           {isProcessing && (
              <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 text-xs animate-pulse text-gray-500">
                    Thinking...
                  </div>
              </div>
           )}
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="p-4 border-t bg-white dark:bg-black">
         <div className="grid grid-cols-3 gap-4">
             <Button variant="outline" size="sm" onClick={() => speak("Where is the break room?")}>
                <Keyboard className="mr-2 h-4 w-4" /> Short Pick
             </Button>
             <Button variant="outline" size="sm" onClick={() => speak("Repeat instruction.")}>
                <RotateCcw className="mr-2 h-4 w-4" /> Repeat
             </Button>
             <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> Confirm
             </Button>
         </div>
      </footer>
    </div>
  );
}
