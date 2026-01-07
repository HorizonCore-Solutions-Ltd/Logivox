/**
 * Voice Control UI Component for LogiVox
 *
 * Provides a beautiful floating voice control interface with:
 * - Microphone permission handling
 * - Visual feedback for listening state
 * - Real-time transcript display
 * - Voice command help
 * - Accessibility compliance (keyboard shortcuts, screen reader support)
 * - Mobile-responsive design
 *
 * Competitive advantage: No inventory management system has voice control!
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  useVoiceControl,
  announceToScreenReader,
  getVoiceCommandsHelp,
  VOICE_COMMANDS,
} from "@/lib/voice-control";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Settings,
  AlertCircle,
  CheckCircle,
  Headphones,
  MessageCircle,
  Navigation,
  Search,
  Edit3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// MAIN VOICE CONTROL COMPONENT
// ==========================================

export function VoiceControl() {
  const {
    listening,
    supported,
    transcript,
    confidence,
    lastCommand,
    error,
    startListening,
    stopListening,
    requestPermission,
  } = useVoiceControl();

  const [showHelp, setShowHelp] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setHasPermission(result.state === "granted");

        result.onchange = () => {
          setHasPermission(result.state === "granted");
        };
      } catch (error) {
        console.warn(
          "[VoiceControl] Could not check microphone permission:",
          error,
        );
      }
    };

    if (typeof navigator !== "undefined" && navigator.permissions) {
      checkPermission();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Ctrl+Shift+V or Cmd+Shift+V to toggle voice control
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "V"
      ) {
        event.preventDefault();
        if (listening) {
          stopListening();
          announceToScreenReader("Voice control stopped");
        } else {
          handleStartListening();
        }
      }

      // Ctrl+Shift+H or Cmd+Shift+H to show help
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "H"
      ) {
        event.preventDefault();
        setShowHelp(true);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [listening, stopListening]);

  const handleStartListening = async () => {
    if (hasPermission === false) {
      const granted = await requestPermission();
      if (!granted) {
        announceToScreenReader(
          "Microphone permission required for voice control",
        );
        return;
      }
      setHasPermission(true);
    }

    startListening();
    announceToScreenReader(
      'Voice control started. Say a command or "help" for assistance.',
    );
  };

  const handleStopListening = () => {
    stopListening();
    announceToScreenReader("Voice control stopped");
  };

  // Don't render if not supported
  if (!supported) {
    return null;
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="icon"
          variant={listening ? "default" : "outline"}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
            listening && "bg-red-500 hover:bg-red-600 animate-pulse",
          )}
          aria-label="Show voice control"
        >
          {listening ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-xl border-2 backdrop-blur-sm bg-background/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Voice Control</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Dialog open={showHelp} onOpenChange={setShowHelp}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Voice command help</span>
                  </Button>
                </DialogTrigger>
                <VoiceCommandHelp />
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(true)}
                aria-label="Minimize voice control"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardDescription>
            Use voice commands to navigate LogiVox hands-free
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status and Controls */}
          <div className="space-y-3">
            {/* Permission Status */}
            {hasPermission === false && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Microphone permission required for voice control.
                      <Button
                        variant="link"
                        className="h-auto p-0 ml-1 text-yellow-800 dark:text-yellow-200"
                        onClick={requestPermission}
                      >
                        Grant permission
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Main Control Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={listening ? handleStopListening : handleStartListening}
                disabled={hasPermission === false}
                size="lg"
                variant={listening ? "destructive" : "default"}
                className={cn(
                  "flex-1 transition-all duration-200",
                  listening && "animate-pulse",
                )}
              >
                {listening ? (
                  <>
                    <VolumeX className="mr-2 h-5 w-5" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Start Listening
                  </>
                )}
              </Button>

              <Badge variant={listening ? "destructive" : "secondary"}>
                {listening ? "LISTENING" : "READY"}
              </Badge>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="text-xs text-muted-foreground text-center">
              Press{" "}
              <kbd className="px-1 py-0.5 text-xs bg-muted rounded">
                Ctrl+Shift+V
              </kbd>{" "}
              to toggle
            </div>
          </div>

          {/* Live Transcript */}
          {(transcript || listening) && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-h-[1.5rem]">
                    {transcript ? (
                      <p className="text-sm">{transcript}</p>
                    ) : listening ? (
                      <p className="text-sm text-muted-foreground italic">
                        Listening...
                      </p>
                    ) : null}
                  </div>
                </div>

                {confidence > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Confidence:
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          confidence > 0.8
                            ? "bg-green-500"
                            : confidence > 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500",
                        )}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Last Command */}
          {lastCommand && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Executed: "{lastCommand}"
              </span>
            </div>
          )}

          {/* Quick Command Examples */}
          <div className="grid grid-cols-2 gap-2">
            <QuickCommandButton
              command="Go to inventory"
              icon={<Navigation className="h-3 w-3" />}
            />
            <QuickCommandButton
              command="Check alerts"
              icon={<AlertCircle className="h-3 w-3" />}
            />
            <QuickCommandButton
              command="Find supplier ABC"
              icon={<Search className="h-3 w-3" />}
            />
            <QuickCommandButton
              command="Show help"
              icon={<HelpCircle className="h-3 w-3" />}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// QUICK COMMAND BUTTON
// ==========================================

interface QuickCommandButtonProps {
  command: string;
  icon: React.ReactNode;
}

function QuickCommandButton({ command, icon }: QuickCommandButtonProps) {
  const handleClick = () => {
    // Announce the command text so it gets processed
    announceToScreenReader(`Voice command example: ${command}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto p-2 text-xs flex flex-col items-center gap-1"
      onClick={handleClick}
    >
      {icon}
      <span className="text-center leading-tight">{command}</span>
    </Button>
  );
}

// ==========================================
// VOICE COMMAND HELP DIALOG
// ==========================================

function VoiceCommandHelp() {
  const commandsByCategory = VOICE_COMMANDS.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category]!.push(cmd);
      return acc;
    },
    {} as Record<string, (typeof VOICE_COMMANDS)[0][]>,
  );

  const categoryIcons = {
    navigation: <Navigation className="h-4 w-4" />,
    search: <Search className="h-4 w-4" />,
    "data-entry": <Edit3 className="h-4 w-4" />,
    action: <Zap className="h-4 w-4" />,
  };

  const categoryDescriptions = {
    navigation: "Navigate between different pages and sections",
    search: "Search for products, customers, and suppliers",
    "data-entry": "Add inventory, create bookings, and manage data",
    action: "Perform system actions and get help",
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          Voice Commands Help
        </DialogTitle>
        <DialogDescription>
          Control LogiVox with natural voice commands. No typing required!
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="commands" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="commands" className="mt-4">
          <div className="max-h-[50vh] overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(commandsByCategory).map(
                ([category, commands]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg capitalize">
                        {categoryIcons[category as keyof typeof categoryIcons]}
                        {category.replace("-", " ")} Commands
                      </CardTitle>
                      <CardDescription>
                        {
                          categoryDescriptions[
                            category as keyof typeof categoryDescriptions
                          ]
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {commands.map((command, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">
                                {command.description}
                              </div>
                              <div className="space-y-1">
                                {command.patterns.map(
                                  (pattern, patternIndex) => (
                                    <Badge
                                      key={patternIndex}
                                      variant="outline"
                                      className="mr-1 mb-1"
                                    >
                                      "{pattern}"
                                    </Badge>
                                  ),
                                )}
                              </div>
                              {command.parameters &&
                                command.parameters.length > 0 && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Parameters:{" "}
                                    {command.parameters
                                      .map((p) => p.name)
                                      .join(", ")}
                                  </div>
                                )}
                            </div>
                            {command.requiresAuth && (
                              <Badge variant="secondary" className="text-xs">
                                Auth Required
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tips" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Speaking Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      Speak clearly and naturally
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Use your normal speaking voice at a moderate pace
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Use exact command phrases</div>
                    <div className="text-sm text-muted-foreground">
                      Say commands exactly as shown for best results
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Wait for the beep</div>
                    <div className="text-sm text-muted-foreground">
                      Start speaking after the microphone activates
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Reduce background noise</div>
                    <div className="text-sm text-muted-foreground">
                      Works best in quiet environments
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browser Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Chrome (Desktop & Mobile)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Edge (Desktop)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Safari (Desktop & iOS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Firefox (Limited)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Toggle voice control</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm">
                    Ctrl+Shift+V
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Show this help</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm">
                    Ctrl+Shift+H
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stop listening (voice)</span>
                  <Badge variant="outline">"Stop listening"</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Accessibility Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Screen Reader Compatible</div>
                    <div className="text-sm text-muted-foreground">
                      All voice commands and status are announced
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Keyboard Navigation</div>
                    <div className="text-sm text-muted-foreground">
                      All controls are accessible via keyboard
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Visual Feedback</div>
                    <div className="text-sm text-muted-foreground">
                      Real-time transcript and confidence indicators
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

// ==========================================
// ACCESSIBILITY SCREEN READER COMPONENT
// ==========================================

export function VoiceControlAnnouncer() {
  const { listening, transcript, lastCommand, error } = useVoiceControl();

  useEffect(() => {
    if (listening) {
      announceToScreenReader(
        "Voice control activated. Listening for commands.",
      );
    }
  }, [listening]);

  useEffect(() => {
    if (lastCommand) {
      announceToScreenReader(`Voice command executed: ${lastCommand}`);
    }
  }, [lastCommand]);

  useEffect(() => {
    if (error) {
      announceToScreenReader(`Voice control error: ${error}`);
    }
  }, [error]);

  // This component doesn't render anything visible
  return null;
}
