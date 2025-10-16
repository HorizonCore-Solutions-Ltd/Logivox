'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Shield, Eye, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useCookieConsent, 
  COOKIE_CATEGORIES, 
  CookieCategory,
  CookieConsent,
} from '@/lib/cookie-consent';

// ==========================================
// COOKIE BANNER COMPONENT
// ==========================================

export function CookieBanner() {
  const { hasConsent, acceptAll, acceptEssential } = useCookieConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Show banner if no consent given
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, [hasConsent]);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    acceptEssential();
    setShowBanner(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    // If user closes settings without making a choice, hide banner
    if (!hasConsent) {
      setShowBanner(false);
    }
  };

  if (!showBanner || hasConsent) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon & Content */}
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">
                  We value your privacy
                </h3>
                <p className="text-xs text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <a 
                    href="/privacy" 
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSettings}
                className="gap-1"
              >
                <Settings className="h-3 w-3" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptEssential}
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <CookieSettingsDialog 
        open={showSettings} 
        onClose={handleCloseSettings}
        onSave={() => {
          setShowSettings(false);
          setShowBanner(false);
        }}
      />
    </>
  );
}

// ==========================================
// COOKIE SETTINGS DIALOG
// ==========================================

interface CookieSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

function CookieSettingsDialog({ open, onClose, onSave }: CookieSettingsDialogProps) {
  const { consent, saveCustomConsent } = useCookieConsent();
  const [settings, setSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      // Initialize settings from current consent or defaults
      const initialSettings: Record<string, boolean> = {};
      COOKIE_CATEGORIES.forEach(category => {
        if (category.essential) {
          initialSettings[category.id] = true; // Essential always enabled
        } else {
          const consentValue = consent?.[category.id as keyof CookieConsent];
          initialSettings[category.id] = typeof consentValue === 'boolean' ? consentValue : false;
        }
      });
      setSettings(initialSettings);
    }
  }, [open, consent]);

  const handleSave = () => {
    saveCustomConsent({
      functional: settings.functional,
      analytics: settings.analytics,
      marketing: settings.marketing,
    });
    onSave();
  };

  const handleAcceptAll = () => {
    const allEnabled: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach(category => {
      allEnabled[category.id] = true;
    });
    setSettings(allEnabled);
    
    saveCustomConsent({
      functional: true,
      analytics: true,
      marketing: true,
    });
    onSave();
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'essential':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'functional':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'analytics':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'marketing':
        return <Eye className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. You can enable or disable different types of cookies below.
            Essential cookies cannot be disabled as they are required for the website to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {COOKIE_CATEGORIES.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.id)}
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {category.essential && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={settings[category.id] ?? false}
                    onCheckedChange={(checked) => {
                      if (!category.essential) {
                        setSettings(prev => ({ ...prev, [category.id]: checked }));
                      }
                    }}
                    disabled={category.essential}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
                
                {/* Show examples for each category */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {category.id === 'essential' && (
                    <span>Examples: Authentication, security, basic functionality</span>
                  )}
                  {category.id === 'functional' && (
                    <span>Examples: Language preferences, chat widgets, user settings</span>
                  )}
                  {category.id === 'analytics' && (
                    <span>Examples: Google Analytics, page views, user behavior (anonymized)</span>
                  )}
                  {category.id === 'marketing' && (
                    <span>Examples: Google Ads, Facebook Pixel, remarketing</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Retention & Rights */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h4 className="text-sm font-semibold mb-2">Your Data Rights</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• You can change your preferences at any time</p>
              <p>• Cookies are stored for up to 1 year</p>
              <p>• You can request data deletion at any time</p>
              <p>• Essential cookies are deleted when you log out</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="outline" onClick={handleAcceptAll} className="flex-1">
            Accept All
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            Save Preferences
          </Button>
        </div>

        {/* Links */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <a 
            href="/privacy" 
            className="text-blue-600 hover:text-blue-800 underline mr-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          <a 
            href="/terms" 
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// COOKIE PREFERENCES COMPONENT (for settings page)
// ==========================================

export function CookiePreferences() {
  const { consent, saveCustomConsent, withdrawConsent, hasConsent } = useCookieConsent();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  useEffect(() => {
    // Initialize settings from current consent
    const initialSettings: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach(category => {
      if (category.essential) {
        initialSettings[category.id] = true;
      } else {
        const consentValue = consent?.[category.id as keyof CookieConsent];
        initialSettings[category.id] = typeof consentValue === 'boolean' ? consentValue : false;
      }
    });
    setSettings(initialSettings);
  }, [consent]);

  const handleSave = () => {
    saveCustomConsent({
      functional: settings.functional,
      analytics: settings.analytics,
      marketing: settings.marketing,
    });
  };

  const handleWithdrawAll = () => {
    withdrawConsent();
    setShowWithdrawDialog(false);
  };

  if (!hasConsent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cookie Preferences Set</h3>
            <p className="text-muted-foreground mb-4">
              You haven't set your cookie preferences yet. Visit our website to configure your preferences.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cookie Preferences</h3>
        <p className="text-muted-foreground">
          Manage how we use cookies to improve your experience on FlowStock.
        </p>
      </div>

      <div className="space-y-4">
        {COOKIE_CATEGORIES.map((category) => (
          <Card key={category.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{category.name}</h4>
                  {category.essential && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={settings[category.id] ?? false}
                  onCheckedChange={(checked) => {
                    if (!category.essential) {
                      setSettings(prev => ({ ...prev, [category.id]: checked }));
                    }
                  }}
                  disabled={category.essential}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Preferences
        </Button>
        <Button variant="outline" onClick={() => setShowWithdrawDialog(true)}>
          Withdraw All Consent
        </Button>
      </div>

      {/* Consent Information */}
      {consent && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h4 className="text-sm font-semibold mb-2">Current Consent</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Consent given: {new Date(consent.timestamp).toLocaleString()}</p>
              <p>Version: {consent.version}</p>
              <p>Essential: ✓ | Functional: {consent.functional ? '✓' : '✗'} | Analytics: {consent.analytics ? '✓' : '✗'} | Marketing: {consent.marketing ? '✓' : '✗'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Consent Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Cookie Consent</DialogTitle>
            <DialogDescription>
              This will remove all non-essential cookies and reset your preferences. 
              You'll need to set your preferences again on your next visit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWithdrawAll}>
              Withdraw All Consent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}