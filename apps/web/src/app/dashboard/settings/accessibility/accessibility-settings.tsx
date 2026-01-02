'use client';

import { useState } from 'react';
import {
  Eye,
  Type,
  Zap,
  Focus,
  Palette,
  MousePointer,
  Layout,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useVisualAccessibility,
  accessibilityPresets,
  type FontSize,
  type ContrastMode,
  type FocusIndicatorStyle,
  type LineSpacing,
} from '@/lib/visual-accessibility';

export function AccessibilitySettings() {
  const {
    fontSize,
    lineSpacing,
    contrastMode,
    reduceMotion,
    reduceTransparency,
    focusIndicatorStyle,
    alwaysShowFocus,
    useColorBlindMode,
    colorBlindType,
    increaseTouchTargets,
    simplifyLayout,
    underlineLinks,
    boldText,
    setFontSize,
    setLineSpacing,
    setContrastMode,
    setReduceMotion,
    setReduceTransparency,
    setFocusIndicatorStyle,
    setAlwaysShowFocus,
    setColorBlindMode,
    setIncreaseTouchTargets,
    setSimplifyLayout,
    setUnderlineLinks,
    setBoldText,
    resetToDefaults,
    applySystemPreferences,
  } = useVisualAccessibility();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '' });
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const toast = (message: { title: string; description: string }) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleApplyPreset = (presetName: keyof typeof accessibilityPresets) => {
    const preset = accessibilityPresets[presetName];
    
    // Apply all preset values
    setFontSize(preset.fontSize);
    setLineSpacing(preset.lineSpacing);
    setContrastMode(preset.contrastMode);
    setReduceMotion(preset.reduceMotion);
    setReduceTransparency(preset.reduceTransparency);
    setFocusIndicatorStyle(preset.focusIndicatorStyle);
    setAlwaysShowFocus(preset.alwaysShowFocus);
    setColorBlindMode(preset.useColorBlindMode, preset.colorBlindType as any);
    setIncreaseTouchTargets(preset.increaseTouchTargets);
    setSimplifyLayout(preset.simplifyLayout);
    setUnderlineLinks(preset.underlineLinks);
    setBoldText(preset.boldText);

    setActivePreset(presetName);
    toast({
      title: 'Preset applied',
      description: `${presetName.charAt(0).toUpperCase() + presetName.slice(1)} preset has been applied.`,
    });
  };

  const handleReset = () => {
    resetToDefaults();
    setActivePreset(null);
    toast({
      title: 'Settings reset',
      description: 'All accessibility settings have been reset to defaults.',
    });
  };

  const handleApplySystem = () => {
    applySystemPreferences();
    setActivePreset(null);
    toast({
      title: 'System preferences applied',
      description: 'Your system accessibility preferences have been applied.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accessibility Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your visual experience to match your needs and preferences.
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Apply preset configurations or sync with system preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant={activePreset === 'default' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('default')}
              className="justify-start"
            >
              Default Settings
            </Button>
            <Button
              variant={activePreset === 'highContrast' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('highContrast')}
              className="justify-start"
            >
              High Contrast
            </Button>
            <Button
              variant={activePreset === 'largeText' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('largeText')}
              className="justify-start"
            >
              Large Text
            </Button>
            <Button
              variant={activePreset === 'reducedMotion' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('reducedMotion')}
              className="justify-start"
            >
              Reduced Motion
            </Button>
            <Button
              variant={activePreset === 'lowVision' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('lowVision')}
              className="justify-start"
            >
              Low Vision
            </Button>
            <Button
              variant={activePreset === 'motorImpairment' ? 'default' : 'outline'}
              onClick={() => handleApplyPreset('motorImpairment')}
              className="justify-start"
            >
              Motor Impairment
            </Button>
          </div>

          <div className="my-4 border-t" />

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleApplySystem} className="flex-1">
              <Info className="h-4 w-4 mr-2" />
              Use System Preferences
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Text & Font Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text & Font
          </CardTitle>
          <CardDescription>
            Adjust text size and spacing for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select value={fontSize} onValueChange={(value) => setFontSize(value as FontSize)}>
              <SelectTrigger id="font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (100%)</SelectItem>
                <SelectItem value="medium">Medium (110%)</SelectItem>
                <SelectItem value="large">Large (125%)</SelectItem>
                <SelectItem value="x-large">Extra Large (150%)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Scales all text on the page. WCAG AA supports up to 200% zoom.
            </p>
          </div>

          {/* Line Spacing */}
          <div className="space-y-2">
            <Label htmlFor="line-spacing">Line Spacing</Label>
            <Select value={lineSpacing} onValueChange={(value) => setLineSpacing(value as LineSpacing)}>
              <SelectTrigger id="line-spacing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="relaxed">Relaxed (1.75)</SelectItem>
                <SelectItem value="loose">Loose (2.0)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Increases space between lines for easier reading.
            </p>
          </div>

          {/* Bold Text */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bold-text">Bold Text</Label>
              <p className="text-sm text-muted-foreground">
                Makes all text heavier for better visibility
              </p>
            </div>
            <Switch
              id="bold-text"
              checked={boldText}
              onCheckedChange={setBoldText}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contrast & Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Contrast & Colors
          </CardTitle>
          <CardDescription>
            Enhance visual contrast for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contrast Mode */}
          <div className="space-y-2">
            <Label htmlFor="contrast-mode">Contrast Mode</Label>
            <Select value={contrastMode} onValueChange={(value) => setContrastMode(value as ContrastMode)}>
              <SelectTrigger id="contrast-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (4.5:1)</SelectItem>
                <SelectItem value="high">High (7:1)</SelectItem>
                <SelectItem value="highest">Highest (Maximum)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Increases contrast ratio between text and background. WCAG AA requires minimum 4.5:1.
            </p>
          </div>

          {/* Color Blind Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="colorblind-mode">Color Blind Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Simulate color blindness types
                </p>
              </div>
              <Switch
                id="colorblind-mode"
                checked={useColorBlindMode}
                onCheckedChange={(checked) => setColorBlindMode(checked, colorBlindType as any)}
              />
            </div>

            {useColorBlindMode && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="colorblind-type">Type</Label>
                <Select
                  value={colorBlindType}
                  onValueChange={(value) => setColorBlindMode(true, value as any)}
                >
                  <SelectTrigger id="colorblind-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                    <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                    <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Motion & Animation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Motion & Animation
          </CardTitle>
          <CardDescription>
            Control animations and visual effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimizes animations and transitions
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>

          {/* Reduce Transparency */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-transparency">Reduce Transparency</Label>
              <p className="text-sm text-muted-foreground">
                Removes transparent backgrounds
              </p>
            </div>
            <Switch
              id="reduce-transparency"
              checked={reduceTransparency}
              onCheckedChange={setReduceTransparency}
            />
          </div>
        </CardContent>
      </Card>

      {/* Focus & Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5" />
            Focus & Navigation
          </CardTitle>
          <CardDescription>
            Customize keyboard focus indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Focus Indicator Style */}
          <div className="space-y-2">
            <Label htmlFor="focus-style">Focus Indicator Style</Label>
            <Select
              value={focusIndicatorStyle}
              onValueChange={(value) => setFocusIndicatorStyle(value as FocusIndicatorStyle)}
            >
              <SelectTrigger id="focus-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subtle">Subtle (1px)</SelectItem>
                <SelectItem value="normal">Normal (2px)</SelectItem>
                <SelectItem value="bold">Bold (4px)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Controls the thickness of focus outlines around interactive elements.
            </p>
          </div>

          {/* Always Show Focus */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="always-focus">Always Show Focus</Label>
              <p className="text-sm text-muted-foreground">
                Show focus indicators for both keyboard and mouse
              </p>
            </div>
            <Switch
              id="always-focus"
              checked={alwaysShowFocus}
              onCheckedChange={setAlwaysShowFocus}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout & Interaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout & Interaction
          </CardTitle>
          <CardDescription>
            Adjust layout and interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Increase Touch Targets */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="touch-targets">Larger Touch Targets</Label>
              <p className="text-sm text-muted-foreground">
                Makes buttons and links larger (48x48px minimum)
              </p>
            </div>
            <Switch
              id="touch-targets"
              checked={increaseTouchTargets}
              onCheckedChange={setIncreaseTouchTargets}
            />
          </div>

          {/* Simplify Layout */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="simplify-layout">Simplify Layout</Label>
              <p className="text-sm text-muted-foreground">
                Removes rounded corners and shadows
              </p>
            </div>
            <Switch
              id="simplify-layout"
              checked={simplifyLayout}
              onCheckedChange={setSimplifyLayout}
            />
          </div>

          {/* Underline Links */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="underline-links">Underline Links</Label>
              <p className="text-sm text-muted-foreground">
                Always underline hyperlinks for clarity
              </p>
            </div>
            <Switch
              id="underline-links"
              checked={underlineLinks}
              onCheckedChange={setUnderlineLinks}
            />
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            LogiVox is designed to meet WCAG 2.1 Level AA standards, ensuring our platform is accessible 
            to users with diverse needs and abilities.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Check className="h-3 w-3 mr-1" />
              WCAG 2.1 AA
            </Badge>
            <Badge variant="secondary">
              <Check className="h-3 w-3 mr-1" />
              Section 508
            </Badge>
            <Badge variant="secondary">
              <Check className="h-3 w-3 mr-1" />
              ADA Compliant
            </Badge>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-1">Need help?</p>
            <p className="text-muted-foreground">
              Contact our accessibility team at{' '}
              <a href="mailto:accessibility@logivox.ai" className="text-primary hover:underline">
                accessibility@logivox.ai
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
