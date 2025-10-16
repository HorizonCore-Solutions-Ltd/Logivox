import { Metadata } from 'next'
import { AccessibilitySettings } from './accessibility-settings'

export const metadata: Metadata = {
  title: 'Accessibility Settings',
  description: 'Customize your visual accessibility preferences for FlowStock',
}

export default function AccessibilitySettingsPage() {
  return <AccessibilitySettings />
}
