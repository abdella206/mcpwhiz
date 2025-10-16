"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { toast } from "@/hooks/use-toast"

interface GoogleOAuthButtonProps {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
  callbackUrl?: string
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function GoogleOAuthButton({
  variant = "outline",
  size = "default",
  className = "",
  disabled = false,
  callbackUrl,
  onError,
  onSuccess,
}: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { initiateGoogleAuth, isLoading: authLoading } = useAuthStore()

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    
    try {
      // Generate callback URL if not provided
      const finalCallbackUrl = callbackUrl || `${window.location.origin}/auth/callback${window.location.search}`
      
      // Initiate Google OAuth
      const authUrl = await initiateGoogleAuth(finalCallbackUrl)
      
      // Call success callback if provided
      onSuccess?.()
      
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error("Google OAuth error:", error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate Google authentication"
      
      // Call error callback if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      } else {
        // Show default error toast
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
    }
  }

  const isButtonDisabled = disabled || isLoading || authLoading

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`${className} ${variant === "outline" ? "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800" : ""}`}
      onClick={handleGoogleAuth}
      disabled={isButtonDisabled}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      Continue with Google
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
} 