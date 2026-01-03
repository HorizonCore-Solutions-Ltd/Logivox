'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function MFASettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<'initial' | 'scan' | 'verify' | 'backup' | 'complete'>('initial');
  
  // Setup data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Form inputs
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  // Check current MFA status
  useEffect(() => {
    checkMFAStatus();
  }, []);

  async function checkMFAStatus() {
    try {
      const response = await fetch('/api/user/mfa-status');
      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.mfaEnabled);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startMFASetup() {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start MFA setup');
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setSetupStep('scan');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start MFA setup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndEnable() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify code');
      }

      setSetupStep('backup');
      toast({
        title: 'Success',
        description: 'MFA has been enabled successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function disableMFA() {
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to disable MFA',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token: disableCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable MFA');
      }

      setMfaEnabled(false);
      setPassword('');
      setDisableCode('');
      
      toast({
        title: 'MFA Disabled',
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable MFA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  }

  function completeSetup() {
    setSetupStep('complete');
    setMfaEnabled(true);
    setTimeout(() => {
      router.push('/dashboard/settings/security');
    }, 2000);
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Two-Factor Authentication
        </h1>
        <p className="text-muted-foreground mt-2">
          Enhance your account security with two-factor authentication (2FA)
        </p>
      </div>

      {!mfaEnabled && setupStep === 'initial' && (
        <Card>
          <CardHeader>
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account by requiring a verification code from your authenticator app when signing in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy on your mobile device.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-semibold">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Scan a QR code with your authenticator app</li>
                <li>Enter the 6-digit code from your app to verify</li>
                <li>Save your backup codes in a secure location</li>
                <li>Use your authenticator app every time you sign in</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={startMFASetup} disabled={loading}>
              <Shield className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          </CardFooter>
        </Card>
      )}

      {!mfaEnabled && setupStep === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Use your authenticator app to scan this QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg">
                  <Image src={qrCodeUrl} alt="MFA QR Code" width={250} height={250} />
                </div>
              )}
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Can't scan the QR code?</p>
                <p className="text-sm">Enter this code manually in your authenticator app:</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{secret}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Button onClick={() => setSetupStep('verify')} className="w-full">
              I've Scanned the Code
            </Button>
          </CardContent>
        </Card>
      )}

      {!mfaEnabled && setupStep === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Setup</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSetupStep('scan')}>
              Back
            </Button>
            <Button onClick={verifyAndEnable} disabled={loading || verificationCode.length !== 6} className="flex-1">
              Verify and Enable
            </Button>
          </CardFooter>
        </Card>
      )}

      {!mfaEnabled && setupStep === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle>Save Your Backup Codes</CardTitle>
            <CardDescription>
              Store these backup codes in a safe place. You can use them to access your account if you lose your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each code can only be used once. Store them securely - you won't be able to see them again!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="text-sm font-mono">{code}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={() => copyToClipboard(backupCodes.join('\n'))} variant="outline" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy All Codes
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={completeSetup} className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              I've Saved My Backup Codes
            </Button>
          </CardFooter>
        </Card>
      )}

      {!mfaEnabled && setupStep === 'complete' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">All Set!</h2>
              <p className="text-muted-foreground">
                Two-factor authentication is now enabled for your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {mfaEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Two-Factor Authentication Enabled
            </CardTitle>
            <CardDescription>
              Your account is protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You'll be asked for a verification code from your authenticator app each time you sign in.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="disable" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="disable">Disable MFA</TabsTrigger>
                <TabsTrigger value="backup">Backup Codes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="disable" className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Disabling two-factor authentication will make your account less secure.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Your Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disable-code">Verification Code</Label>
                    <Input
                      id="disable-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <Button onClick={disableMFA} disabled={loading} variant="destructive" className="w-full">
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="backup" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use backup codes to access your account if you lose your authenticator device.
                </p>
                <Button className="w-full" variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
