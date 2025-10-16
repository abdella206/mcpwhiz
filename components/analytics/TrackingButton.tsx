"use client"

import { Button, ButtonProps } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics/gtag"

interface TrackingButtonProps extends ButtonProps {
  trackingAction: string
  trackingCategory?: string
  trackingLabel?: string
  trackingValue?: number
}

export function TrackingButton({
  trackingAction,
  trackingCategory = "button",
  trackingLabel,
  trackingValue,
  onClick,
  children,
  ...props
}: TrackingButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Track the event
    trackEvent({
      action: trackingAction,
      category: trackingCategory,
      label: trackingLabel,
      value: trackingValue,
    })

    // Call the original onClick if provided
    if (onClick) {
      onClick(event)
    }
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}

// Example usage:
// <TrackingButton 
//   trackingAction="view_pricing" 
//   trackingCategory="navigation"
//   trackingLabel="header_cta"
// >
//   View Pricing
// </TrackingButton>
