
---
name: saas-redesign
description: Redesigns the Catalyst Components inventory app UI from a top nav bar to a modern SaaS-style layout with a collapsible vertical sidebar on the left.
---

# SaaS Redesign — Vertical Sidebar Layout

This skill transforms `client/src/App.vue` from a horizontal top-nav layout to a modern SaaS-style layout with a collapsible vertical sidebar. The filter bar moves to the top of the main content area. The sidebar collapses to an icon-only rail.

**MANDATORY**: Delegate all `.vue` file creation and editing to the `vue-expert` agent.

---

## What Changes

| Before | After |
|---|---|
| `.app` flex column, top nav + filter + content | `.app-layout` flex row: sidebar + main wrapper |
| Nav links horizontal in header | Nav links vertical in sidebar with icons |
| Logo in header | Logo at top of sidebar |
| ProfileMenu + LanguageSwitcher in header | ProfileMenu at sidebar footer, LanguageSwitcher stays near it |
| FilterBar below header | FilterBar at top of `.main-wrapper` |

**Files modified**: only `client/src/App.vue`.

---

## Target Layout Structure

```
┌──────────────────────────────────────────────┐
│  ┌────────┐  ┌────────────────────────────┐  │
│  │        │  │  FilterBar                 │  │
│  │  SIDE  │  ├────────────────────────────┤  │
│  │  BAR   │  │                            │  │
│  │        │  │   <router-view />          │  │
│  │        │  │                            │  │
│  │ [prof] │  │                            │  │
│  │ [◀]   │  │                            │  │
│  └────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

Collapsed state: sidebar narrows to 64px (icons only, no labels).

---

## Design Tokens

```
Sidebar background:      #0f172a
Sidebar border-right:    1px solid #1e293b
Sidebar expanded width:  240px
Sidebar collapsed width: 64px
Sidebar transition:      width 0.2s ease

Nav item default text:   #94a3b8
Nav item hover bg:       #1e293b
Nav item hover text:     #f1f5f9
Nav item active bg:      #1e3a5f   (blue-900 equivalent)
Nav item active text:    #60a5fa   (blue-400)
Nav item active border:  3px solid #3b82f6 on left edge

Logo text color:         #f8fafc
Logo sub text:           #64748b

Collapse button bg:      #1e293b on hover
Collapse button icon:    #94a3b8

Icon size:               20px × 20px
Nav item padding:        0.625rem 1rem (expanded), 0.625rem centered (collapsed)
Label font-size:         0.875rem
Label font-weight:       500
```

---

## SVG Icons

Use these inline SVG paths (viewBox="0 0 24 24", stroke-based, no fill):

**Overview (dashboard grid)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
</svg>
```

**Inventory (box/package)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
  <line x1="10" y1="12" x2="14" y2="12"/>
</svg>
```

**Orders (clipboard list)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
</svg>
```

**Finance (bar chart)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="16"/><line x1="2" y1="20" x2="22" y2="20"/>
</svg>
```

**Demand Forecast (trending up)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
  <polyline points="17 6 23 6 23 12"/>
</svg>
```

**Restocking (refresh arrows)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
</svg>
```

**Reports (file text)**
```svg
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</svg>
```

**Collapse left arrow** (used when expanded)
```svg
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="15 18 9 12 15 6"/>
</svg>
```

**Expand right arrow** (used when collapsed)
```svg
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 18 15 12 9 6"/>
</svg>
```

---

## Nav Link Definitions

```js
const navLinks = [
  { to: '/',           labelKey: 'nav.overview',       icon: 'overview'  },
  { to: '/inventory',  labelKey: 'nav.inventory',       icon: 'inventory' },
  { to: '/orders',     labelKey: 'nav.orders',          icon: 'orders'    },
  { to: '/spending',   labelKey: 'nav.finance',         icon: 'finance'   },
  { to: '/demand',     labelKey: 'nav.demandForecast',  icon: 'demand'    },
  { to: '/restocking', labelKey: 'nav.restocking',      icon: 'restocking'},
  { to: '/reports',    label:    'Reports',             icon: 'reports'   },
]
```

Use `t(labelKey)` for translated links; `label` as fallback for Reports (no i18n key yet).

---

## Template Structure

Replace the entire `<template>` with:

```html
<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="sidebar-logo__mark">C</div>
        <div class="sidebar-logo__text" v-show="!sidebarCollapsed">
          <span class="sidebar-logo__name">{{ t('nav.companyName') }}</span>
          <span class="sidebar-logo__sub">{{ t('nav.subtitle') }}</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="sidebar-nav__item"
          :class="{ 'sidebar-nav__item--active': isActiveRoute(link.to) }"
          :title="sidebarCollapsed ? (link.label || t(link.labelKey)) : undefined"
        >
          <!-- inline SVG rendered via v-html from a computed map -->
          <span class="sidebar-nav__icon" v-html="navIcons[link.icon]"></span>
          <span class="sidebar-nav__label" v-show="!sidebarCollapsed">
            {{ link.label || t(link.labelKey) }}
          </span>
        </router-link>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
        <button class="sidebar-collapse-btn" @click="toggleSidebar" :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <span v-html="sidebarCollapsed ? navIcons.expandArrow : navIcons.collapseArrow"></span>
        </button>
      </div>

    </aside>

    <!-- Main wrapper: filter bar + page content -->
    <div class="main-wrapper">
      <FilterBar />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- Modals (unchanged) -->
    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />
    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>
```

---

## Script Changes

Keep the entire existing `setup()` logic unchanged. Add the following to the `setup()` return:

```js
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Inside setup():
const route = useRoute()
const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value))
}

// Exact-match for '/', prefix-match for all others
const isActiveRoute = (to) => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const navLinks = [
  { to: '/',           labelKey: 'nav.overview',      icon: 'overview'   },
  { to: '/inventory',  labelKey: 'nav.inventory',      icon: 'inventory'  },
  { to: '/orders',     labelKey: 'nav.orders',         icon: 'orders'     },
  { to: '/spending',   labelKey: 'nav.finance',        icon: 'finance'    },
  { to: '/demand',     labelKey: 'nav.demandForecast', icon: 'demand'     },
  { to: '/restocking', labelKey: 'nav.restocking',     icon: 'restocking' },
  { to: '/reports',    label: 'Reports',               icon: 'reports'    },
]

const navIcons = {
  overview:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  inventory:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  orders:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
  finance:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  demand:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  restocking:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
  reports:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  collapseArrow:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  expandArrow:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
}

// Add to return: sidebarCollapsed, toggleSidebar, isActiveRoute, navLinks, navIcons
```

---

## CSS Changes

**Replace** the `.app`, `.top-nav`, `.nav-container`, `.logo`, `.subtitle`, `.nav-tabs` blocks in `<style>`. Keep all other global styles (`.stats-grid`, `.card`, `.table-container`, `.badge`, `.loading`, `.error`, etc.) unchanged.

Add these new blocks:

```css
/* ── Layout shell ── */
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  z-index: 100;
}

.sidebar--collapsed {
  width: 64px;
  min-width: 64px;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #1e293b;
  min-height: 64px;
}

.sidebar-logo__mark {
  width: 32px;
  height: 32px;
  min-width: 32px;
  background: #2563eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
}

.sidebar-logo__text {
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-logo__name {
  display: block;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.sidebar-logo__sub {
  display: block;
  font-size: 0.6875rem;
  color: #64748b;
  font-weight: 400;
  margin-top: 1px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  border-left: 3px solid transparent;
  position: relative;
}

.sidebar-nav__item:hover {
  background: #1e293b;
  color: #f1f5f9;
}

.sidebar-nav__item--active {
  background: #1e3a5f;
  color: #60a5fa;
  border-left-color: #3b82f6;
}

.sidebar-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.sidebar-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Collapsed nav: center the icon */
.sidebar--collapsed .sidebar-nav__item {
  padding: 0.625rem;
  justify-content: center;
  border-left: none;
  border-radius: 6px;
}

.sidebar--collapsed .sidebar-nav__item--active {
  background: #1e3a5f;
  color: #60a5fa;
}

/* Footer */
.sidebar-footer {
  padding: 0.75rem 0.5rem;
  border-top: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-collapse-btn:hover {
  background: #1e293b;
  color: #94a3b8;
}

/* ── Main wrapper ── */
.main-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
}
```

**Remove** the `max-width: 1600px; margin: 0 auto;` constraint from `.main-content` — the sidebar layout doesn't need a centered max-width.

---

## ProfileMenu & LanguageSwitcher in Dark Sidebar

The `ProfileMenu` and `LanguageSwitcher` components were designed for a white header. In the dark sidebar they need minor color overrides. Add these scoped overrides inside the sidebar footer via CSS (in `<style>` — no scoping needed since they are global):

```css
.sidebar-footer .profile-menu-trigger,
.sidebar-footer .language-switcher {
  color: #94a3b8;
  background: transparent;
}

.sidebar-footer .profile-menu-trigger:hover,
.sidebar-footer .language-switcher:hover {
  background: #1e293b;
  color: #f1f5f9;
}
```

If the existing `.profile-menu-trigger` or `.language-switcher` selectors differ, check `ProfileMenu.vue` and `LanguageSwitcher.vue` to find the root element class and adjust accordingly.

---

## Verification Steps

After the vue-expert completes the changes, verify using Playwright MCP tools:

1. Navigate to `http://localhost:3000`
2. Take a screenshot — confirm the sidebar is visible on the left with dark background
3. Confirm the filter bar appears above the page content (not inside the sidebar)
4. Click each nav link — confirm route changes and active state updates
5. Click the collapse button — confirm the sidebar narrows to ~64px and only icons are visible
6. Reload the page — confirm collapsed state persists (localStorage)
7. Click the expand button — confirm sidebar returns to 240px with labels

If the servers are not running, start them first with `/start`.

---

## Checklist

- [ ] `.app-layout` replaces `.app` as the root element
- [ ] Sidebar uses `#0f172a` background, `240px` / `64px` widths
- [ ] `sidebarCollapsed` state persists to `localStorage`
- [ ] All 7 nav links have correct icons and routes
- [ ] Active route highlighted with blue accent + left border
- [ ] Collapsed nav shows icons only (no labels), centered
- [ ] FilterBar is the first child of `.main-wrapper`, not inside the sidebar
- [ ] ProfileMenu and LanguageSwitcher moved to sidebar footer
- [ ] Modals (ProfileDetailsModal, TasksModal) unchanged
- [ ] All existing global CSS (`.card`, `.badge`, `.stats-grid`, etc.) preserved
- [ ] No `max-width` constraint on `.main-content`
