---
name: SOLEX Life Sciences Enterprise Suite
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#ffffff'
  surface-container-high: '#eff6ff'
  surface-container-highest: '#dbeafe'
  on-surface: '#0f172a'
  on-surface-variant: '#64748b'
  inverse-surface: '#1e293b'
  inverse-on-surface: '#f8fafc'
  outline: '#e2e8f0'
  outline-variant: '#cbd5e1'
  surface-tint: '#1e40af'
  primary: '#1e40af'           # Royal Blue
  on-primary: '#ffffff'
  primary-container: '#eff6ff'
  on-primary-container: '#1e3a8a'
  secondary: '#d97706'         # Dark Yellow / Deep Amber
  on-secondary: '#ffffff'
  secondary-container: '#fef3c7'
  on-secondary-container: '#78350f'
  tertiary: '#0284c7'          # Clinical / Sky Blue
  on-tertiary: '#ffffff'
  tertiary-container: '#e0f2fe'
  on-tertiary-container: '#0369a1'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#7f1d1d'
  background: '#f8fafc'        # Soft Off-White
  on-background: '#0f172a'
  badge-blue: '#eff6ff'
  text-blue: '#1e40af'
  badge-yellow: '#fef3c7'
  text-yellow: '#b45309'
  border-subtle: '#e2e8f0'
  text-muted: '#64748b'
typography:
  headline-xl:
    fontFamily: Inter, sans-serif
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter, sans-serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter, sans-serif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.35'
  body-lg:
    fontFamily: Inter, sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter, sans-serif
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter, sans-serif
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter, sans-serif
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.06em
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  container-padding: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

# SOLEX Life Sciences Design System

## 1. Brand Identity & Color Philosophy
**SOLEX Life Sciences** is a high-density, mission-critical ERP platform supporting Global Life Science Supply Chain, Clinical Diagnostics, Pharmaceutical Trade, Workforce Management, and Regulatory Compliance.

### The 3 Core Brand Colors:
1. **Crisp White (`#FFFFFF`)**: Pure white card surfaces, modals, and container backgrounds providing clinical clarity and maximum readability against a soft canvas (`#F8FAFC`).
2. **Deep Royal Blue (`#1E40AF`)**: The primary brand color symbolizing clinical precision, institutional trust, and stability. Used for primary buttons, active navigation states, key metric highlights, and executive titles.
3. **Dark Yellow / Deep Amber (`#D97706` / `#B45309`)**: The secondary/accent color evoking energy, active monitoring, and scientific innovation. Used for notifications, contract metrics, critical warnings, and accent badges.

---

## 2. Component Design Tokens

### Interactive Elements:
- **Primary Buttons**: `bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md shadow-sm font-semibold`
- **Accent Buttons**: `bg-[#D97706] hover:bg-[#B45309] text-white rounded-md shadow-sm font-semibold`
- **Secondary / Outlined Buttons**: `bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700`
- **Active Navigation Pill**: `bg-[#1E40AF] text-white shadow-sm ring-1 ring-blue-700` with dark yellow icon highlights.

### Status Badges:
- **Active / Success**: `bg-blue-50 text-[#1E40AF] border border-blue-200`
- **Warning / Review Required**: `bg-amber-50 text-[#B45309] border border-amber-200`
- **Critical Alert / Overdue**: `bg-red-50 text-red-700 border border-red-200`
- **Informational / Neutral**: `bg-slate-100 text-slate-700 border border-slate-200`
