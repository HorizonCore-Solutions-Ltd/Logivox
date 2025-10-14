"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Lock, ArrowRight, Github, Chrome } from "lucide-react"

export default function SignInPage() {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    rememberMe: false
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log("Sign in attempted:", formData)
    alert("Sign in functionality will be implemented with authentication system")
    
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }))
  }

  const handleOAuthSignIn = (provider: string) => {
    alert(`${provider} OAuth will be implemented with authentication system`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">FlowStock</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn('Google')}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn('GitHub')}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input pl-10"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="form-field">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Security Badge */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Secured with enterprise-grade encryption</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/sign-up" className="text-primary font-medium hover:underline">
            Sign up for free
          </Link>
        </div>

        {/* Enterprise Notice */}
        <div className="mt-4 text-center">
          <Badge variant="secondary" className="text-xs">
            Enterprise SSO available
          </Badge>
        </div>
      </div>
    </div>
  )
}
