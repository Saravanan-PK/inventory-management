<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{
      'sidebar--collapsed': isCollapsed,
      'sidebar--mobile-hidden': isMobile && !mobileOpen,
      'sidebar--mobile-open': isMobile && mobileOpen
    }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="sidebar-logo__mark">C</div>
        <div class="sidebar-logo__text" v-show="!isCollapsed">
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
          :title="isCollapsed ? (link.label || t(link.labelKey)) : undefined"
        >
          <span class="sidebar-nav__icon" v-html="navIcons[link.icon]"></span>
          <span class="sidebar-nav__label" v-show="!isCollapsed">
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
        <button class="sidebar-collapse-btn" @click="toggleSidebar"
          :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <span v-html="isCollapsed ? navIcons.expandArrow : navIcons.collapseArrow"></span>
        </button>
      </div>

    </aside>

    <!-- Main wrapper -->
    <div class="main-wrapper">
      <!-- Mobile-only top bar -->
      <div class="mobile-header" v-if="isMobile">
        <button class="mobile-menu-btn" @click="toggleSidebar" aria-label="Open navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="mobile-header__title">{{ t('nav.companyName') }}</span>
      </div>
      <FilterBar />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- Mobile backdrop -->
    <div v-if="isMobile && mobileOpen" class="sidebar-backdrop" @click="mobileOpen = false"></div>

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

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(() => {
      loadTasks()
      window.addEventListener('resize', handleResize)
    })

    const route = useRoute()
    const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

    const windowWidth = ref(window.innerWidth)
    const handleResize = () => { windowWidth.value = window.innerWidth }
    onUnmounted(() => window.removeEventListener('resize', handleResize))

    const isMobile = computed(() => windowWidth.value < 640)
    const isTablet = computed(() => windowWidth.value >= 640 && windowWidth.value < 1024)

    const mobileOpen = ref(false)

    const toggleSidebar = () => {
      if (isMobile.value) {
        mobileOpen.value = !mobileOpen.value
      } else {
        sidebarCollapsed.value = !sidebarCollapsed.value
        localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value))
      }
    }

    // Drive the sidebar--collapsed class from one place
    const isCollapsed = computed(() => {
      if (isMobile.value) return false   // mobile: full-width overlay or hidden
      if (isTablet.value) return true    // tablet: always icon rail
      return sidebarCollapsed.value      // desktop: user preference
    })

    // Close mobile overlay on navigation
    watch(() => route.path, () => { mobileOpen.value = false })

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

    return {
      t,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask,
      sidebarCollapsed,
      toggleSidebar,
      isActiveRoute,
      navLinks,
      navIcons,
      isMobile,
      isTablet,
      mobileOpen,
      isCollapsed
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f8fafc;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

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

.sidebar--collapsed .sidebar-nav__item {
  padding: 0.625rem;
  justify-content: center;
  border-left: none;
}

.sidebar--collapsed .sidebar-nav__item--active {
  background: #1e3a5f;
  color: #60a5fa;
}

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

.main-content {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.page-header p {
  color: #64748b;
  font-size: 0.938rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.625rem;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: #ea580c;
}

.stat-card.success .stat-value {
  color: #059669;
}

.stat-card.danger .stat-value {
  color: #dc2626;
}

.stat-card.info .stat-value {
  color: #2563eb;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.875rem;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: #f8fafc;
}

.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.badge.danger {
  background: #fecaca;
  color: #991b1b;
}

.badge.info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.increasing {
  background: #d1fae5;
  color: #065f46;
}

.badge.decreasing {
  background: #fecaca;
  color: #991b1b;
}

.badge.stable {
  background: #e0e7ff;
  color: #3730a3;
}

.badge.high {
  background: #fecaca;
  color: #991b1b;
}

.badge.medium {
  background: #fed7aa;
  color: #92400e;
}

.badge.low {
  background: #dbeafe;
  color: #1e40af;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.938rem;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.938rem;
}

/* ── Responsive sidebar ── */

/* Mobile: slide sidebar off-screen by default */
.sidebar--mobile-hidden {
  transform: translateX(-100%);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 200;
}

/* Mobile: slide-in overlay */
.sidebar--mobile-open {
  transform: translateX(0);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px !important;
  min-width: 240px !important;
  z-index: 200;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  transition: transform 0.25s ease;
}

/* Backdrop */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 199;
}

/* Mobile top bar */
.mobile-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  height: 52px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.mobile-menu-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.mobile-header__title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

/* Hide collapse button on tablet — sidebar is always icon-rail there */
@media (min-width: 640px) and (max-width: 1023px) {
  .sidebar-collapse-btn {
    display: none;
  }
}

/* Smooth slide transition for mobile sidebar */
.sidebar {
  transition: width 0.2s ease, min-width 0.2s ease, transform 0.25s ease;
}

@media (max-width: 639px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
