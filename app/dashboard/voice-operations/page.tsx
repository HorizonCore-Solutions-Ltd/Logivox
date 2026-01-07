"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  Globe,
  Headphones,
  Settings,
  TrendingUp,
  Package,
  ArrowRight,
  Clock,
  Target,
  Users,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface VoiceTask {
  id: string;
  type: "picking" | "receiving" | "cycle-count" | "putaway" | "packing";
  description: string;
  location: string;
  item: string;
  quantity: number;
  priority: "Low" | "Medium" | "High";
  status: "pending" | "in-progress" | "completed";
  instructions: string[];
  currentStep: number;
}

interface VoiceSession {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  tasksCompleted: number;
  accuracy: number;
  language: string;
  duration: number;
}

const LANGUAGES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "es-ES", name: "Spanish (Spain)", flag: "🇪🇸" },
  { code: "es-MX", name: "Spanish (Mexico)", flag: "🇲🇽" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "zh-CN", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "pl-PL", name: "Polish", flag: "🇵🇱" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "ru-RU", name: "Russian", flag: "🇷🇺" },
  { code: "tr-TR", name: "Turkish", flag: "🇹🇷" },
  { code: "vi-VN", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th-TH", name: "Thai", flag: "🇹🇭" },
  { code: "sv-SE", name: "Swedish", flag: "🇸🇪" },
];

export default function VoiceOperationsPage() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [currentTask, setCurrentTask] = useState<VoiceTask | null>(null);
  const [activeSessions, setActiveSessions] = useState<VoiceSession[]>([]);
  const [commandHistory, setCommandHistory] = useState<
    Array<{ time: string; command: string; response: string; success: boolean }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sample task data
  const sampleTask: VoiceTask = {
    id: "TASK-001",
    type: "picking",
    description: "Pick order #ORD-12345",
    location: "A-12-3",
    item: "SKU-8374",
    quantity: 5,
    priority: "High",
    status: "in-progress",
    instructions: [
      "Proceed to location A-12-3",
      "Scan barcode to confirm location",
      "Pick 5 units of SKU-8374",
      "Confirm quantity picked",
      "Proceed to packing station B-5",
    ],
    currentStep: 2,
  };

  // Analytics data
  const sessionData = [
    { hour: "8AM", tasks: 24, accuracy: 98 },
    { hour: "9AM", tasks: 31, accuracy: 97 },
    { hour: "10AM", tasks: 28, accuracy: 99 },
    { hour: "11AM", tasks: 35, accuracy: 96 },
    { hour: "12PM", tasks: 22, accuracy: 98 },
    { hour: "1PM", tasks: 26, accuracy: 97 },
    { hour: "2PM", tasks: 33, accuracy: 99 },
    { hour: "3PM", tasks: 29, accuracy: 98 },
  ];

  const taskTypeData = [
    { type: "Picking", count: 142, time: 8.2 },
    { type: "Receiving", count: 67, time: 12.5 },
    { type: "Cycle Count", count: 34, time: 6.8 },
    { type: "Putaway", count: 89, time: 7.3 },
    { type: "Packing", count: 56, time: 5.1 },
  ];

  const languageUsage = [
    { language: "English", users: 45, percentage: 62 },
    { language: "Spanish", users: 18, percentage: 25 },
    { language: "French", users: 6, percentage: 8 },
    { language: "German", users: 3, percentage: 4 },
    { language: "Other", users: 1, percentage: 1 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        setTranscript(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthesisRef.current = new SpeechSynthesisUtterance();
      synthesisRef.current.lang = selectedLanguage;
      synthesisRef.current.onstart = () => setIsSpeaking(true);
      synthesisRef.current.onend = () => setIsSpeaking(false);
    }

    // Sample active sessions
    setActiveSessions([
      {
        id: "S-001",
        userId: "U-123",
        userName: "John Smith",
        startTime: new Date(Date.now() - 3600000),
        tasksCompleted: 28,
        accuracy: 98.5,
        language: "en-US",
        duration: 60,
      },
      {
        id: "S-002",
        userId: "U-124",
        userName: "Maria Garcia",
        startTime: new Date(Date.now() - 7200000),
        tasksCompleted: 42,
        accuracy: 99.2,
        language: "es-ES",
        duration: 120,
      },
      {
        id: "S-003",
        userId: "U-125",
        userName: "Pierre Dubois",
        startTime: new Date(Date.now() - 1800000),
        tasksCompleted: 15,
        accuracy: 97.8,
        language: "fr-FR",
        duration: 30,
      },
    ]);

    setCurrentTask(sampleTask);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (voiceEnabled && synthesisRef.current) {
      synthesisRef.current.text = text;
      window.speechSynthesis.speak(synthesisRef.current);
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    let response = "";
    let success = true;

    if (lowerCommand.includes("next") || lowerCommand.includes("continue")) {
      response = "Moving to next step";
      speak(response);
    } else if (
      lowerCommand.includes("confirm") ||
      lowerCommand.includes("complete")
    ) {
      response = "Task confirmed and completed";
      speak(response);
    } else if (
      lowerCommand.includes("location") ||
      lowerCommand.includes("where")
    ) {
      response = `Your current location is ${currentTask?.location}`;
      speak(response);
    } else if (
      lowerCommand.includes("quantity") ||
      lowerCommand.includes("how many")
    ) {
      response = `Pick ${currentTask?.quantity} units`;
      speak(response);
    } else if (lowerCommand.includes("help")) {
      response = "Available commands: next, confirm, location, quantity, help";
      speak(response);
    } else {
      response = 'Command not recognized. Say "help" for available commands';
      success = false;
      speak(response);
    }

    setCommandHistory((prev) => [
      { time: new Date().toLocaleTimeString(), command, response, success },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Voice-Directed Operations</h1>
        <p className="text-muted-foreground">
          Hands-free warehouse operations with voice commands in 20+ languages
        </p>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">388</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> vs average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.2%</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time/Task</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2min</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-15%</span> faster
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Session</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Live Session Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Voice Control Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Voice Control
                </CardTitle>
                <CardDescription>
                  Hands-free operation with real-time voice recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Button
                      variant={voiceEnabled ? "default" : "outline"}
                      size="icon"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                    >
                      {voiceEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Voice Control Buttons */}
                <div className="flex items-center justify-center gap-4 py-8">
                  <Button
                    variant={isListening ? "destructive" : "default"}
                    size="lg"
                    onClick={toggleListening}
                    className="h-24 w-24 rounded-full"
                  >
                    {isListening ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Badge
                    variant={isListening ? "default" : "secondary"}
                    className="text-sm py-1"
                  >
                    {isListening
                      ? "🔴 Listening..."
                      : "Press to start voice control"}
                  </Badge>
                  {isSpeaking && (
                    <Badge variant="outline" className="text-sm py-1 ml-2">
                      🔊 Speaking...
                    </Badge>
                  )}
                </div>

                {/* Live Transcript */}
                <div className="mt-4 p-4 bg-muted rounded-lg min-h-[100px]">
                  <Label className="text-sm font-medium mb-2 block">
                    Live Transcript:
                  </Label>
                  <p className="text-sm">
                    {transcript || "Waiting for voice input..."}
                  </p>
                </div>

                {/* Quick Commands */}
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Quick Commands:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak("Next step")}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak("Confirm")}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak("Location")}
                    >
                      Location
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak("Quantity")}
                    >
                      Quantity
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak("Help")}
                    >
                      Help
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Task */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTask ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Task ID:</span>
                        <Badge>{currentTask.id}</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Type:</span>
                        <Badge variant="outline">{currentTask.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Priority:</span>
                        <Badge
                          variant={
                            currentTask.priority === "High"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {currentTask.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress:</span>
                        <span className="text-muted-foreground">
                          Step {currentTask.currentStep} of{" "}
                          {currentTask.instructions.length}
                        </span>
                      </div>
                      <Progress
                        value={
                          (currentTask.currentStep /
                            currentTask.instructions.length) *
                          100
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Instructions:
                      </Label>
                      <ol className="space-y-2 text-sm">
                        {currentTask.instructions.map((instruction, index) => (
                          <li
                            key={index}
                            className={`flex items-start gap-2 ${
                              index < currentTask.currentStep
                                ? "text-muted-foreground line-through"
                                : index === currentTask.currentStep
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {index < currentTask.currentStep ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            ) : index === currentTask.currentStep ? (
                              <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                            ) : (
                              <span className="h-4 w-4 flex items-center justify-center text-xs mt-0.5">
                                {index + 1}
                              </span>
                            )}
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                      <Button variant="outline" size="sm">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No active task</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Command History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Command History
              </CardTitle>
              <CardDescription>
                Recent voice commands and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commandHistory.length > 0 ? (
                  commandHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {entry.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            You: {entry.command}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          System: {entry.response}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No commands yet. Start speaking to see history here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Voice Sessions</CardTitle>
              <CardDescription>
                Real-time monitoring of all active voice-directed operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map((session) => {
                  const language = LANGUAGES.find(
                    (l) => l.code === session.language,
                  );
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{session.userName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>
                              {language?.flag} {language?.name}
                            </span>
                            <span>•</span>
                            <span>{session.duration} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {session.tasksCompleted}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tasks
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {session.accuracy}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Accuracy
                          </div>
                        </div>
                        <Badge variant="default" className="animate-pulse">
                          Active
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Task Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks & Accuracy by Hour</CardTitle>
                <CardDescription>Today's performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="tasks"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Tasks Completed"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Accuracy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Type</CardTitle>
                <CardDescription>
                  Distribution of task types completed today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      fill="#3b82f6"
                      name="Count"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="time"
                      fill="#10b981"
                      name="Avg Time (min)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Language Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Language Usage</CardTitle>
                <CardDescription>
                  Distribution of languages used by workers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {languageUsage.map((lang, index) => (
                    <div key={lang.language}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {lang.language}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {lang.users} users ({lang.percentage}%)
                        </span>
                      </div>
                      <Progress value={lang.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key insights from voice operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Voice operations 35% faster
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Compared to traditional RF scanning methods
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        98.5% accuracy rate
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Highest ever recorded this quarter
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Globe className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        20+ languages supported
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Enabling diverse workforce integration
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <BarChart3 className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        45% reduction in training time
                      </div>
                      <div className="text-sm text-muted-foreground">
                        New workers productive in hours vs days
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
              <CardDescription>
                Configure voice recognition and synthesis settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <Select defaultValue="en-US">
                  <SelectTrigger id="default-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-speed">Speech Speed</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="voice-speed"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    defaultValue="1"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    1.0x
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    80%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voice Confirmation</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      Require voice confirmation
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ask for verbal confirmation before completing tasks
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-Listen</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      Automatic listening mode
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Keep microphone active between commands
                    </div>
                  </div>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>

              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
