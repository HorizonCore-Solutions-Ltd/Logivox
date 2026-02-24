# Voice Browser Guide (Public + Authenticated)

Hands-free navigation for both marketing visitors and signed-in users. Uses the browser Web Speech API (no server round-trips) and the built-in LogiVox voice control UI.

## Quick Start
- Desktop: Chrome/Edge recommended; Safari works but may re-request mic access.
- Mobile: Chrome (Android) works; iOS Safari requires a tap to start each session.
- Toggle listening: `Ctrl/Cmd + Shift + V`. Show help: `Ctrl/Cmd + Shift + H`.
- Allow the microphone when prompted. Use a headset in noisy environments.

## Core Commands

### Marketing (no login required)
- "Go to homepage" → /
- "Show features" → /#features
- "Show pricing" → /#pricing
- "Show proof" → /#trust
- "Get started" → /#get-started
- "Login" → /sign-in
- "Sign up" → /sign-up
- "Open docs" → /docs
- "Contact support" → /services/support
- "Voice help" → /voice-browser

### Signed-in Navigation (requires auth)
- "Go to dashboard" → /dashboard
- "Go to inventory" → /dashboard/inventory
- "Go to reports" → /dashboard/reports
- "Check alerts" → /dashboard/alerts
- "Go to customers" → /dashboard/customers
- "Find {product}" → /dashboard/inventory?search={product}
- "Find customer {name}" → /dashboard/customers?search={name}

### Tips
- Speak the exact phrase; pause between commands.
- If accuracy drops, toggle listening off/on or refresh the page.
- Use the floating mic control (bottom-right) to manage listening state.

## FAQ
- **Where is the data processed?** In-browser via Web Speech API. We do not store voice audio; only the resulting navigation actions occur locally.
- **Why no response?** Mic may be blocked. Click the mic icon in the address bar and allow access, then retry.
- **Does it work offline?** No. Speech recognition requires network connectivity to the browser's speech service.
- **Can I disable it?** Stop listening with `Ctrl/Cmd + Shift + V` or close the mic panel. The component does not auto-start.

## Rollout Notes
- Voice control UI now mounts globally (marketing + app) via the root layout.
- Marketing sections now expose anchors: #home, #features, #pricing, #trust, #get-started.
- New public guide: /voice-browser (includes cheat sheet and FAQ).

## Support
Contact support at /services/support or open /docs for deep dives. For incidents, follow the standard support runbook and capture browser console logs if recognition fails.
