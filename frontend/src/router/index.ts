import { createRouter, createWebHistory } from 'vue-router'
import api, { isAuthenticated } from '@/services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomeView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/diagnosis',
      name: 'diagnosis',
      component: () => import('@/pages/DiagnosisView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/form/:token',
      name: 'patient-form',
      component: () => import('@/pages/PatientFormView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/ProfileView.vue'),
      meta: { layout: 'main', requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'doctor-dashboard',
      component: () => import('@/pages/DoctorDashboardView.vue'),
      meta: { layout: 'main', requiresAuth: true },
    },
    {
      path: '/dashboard/:id',
      name: 'doctor-dashboard-detail',
      component: () => import('@/pages/DoctorFormSummaryView.vue'),
      meta: { layout: 'main', requiresAuth: true },
    },
    {
      path: '/results/:id',
      name: 'results',
      component: () => import('@/pages/ResultsView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/mentions-legales',
      name: 'legal-notice',
      component: () => import('@/pages/LegalNoticeView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/confidentialite',
      alias: '/politique-confidentialite',
      name: 'privacy-policy',
      component: () => import('@/pages/PrivacyPolicyView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/conditions-utilisation',
      name: 'terms',
      component: () => import('@/pages/TermsView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/cookies',
      name: 'cookies',
      component: () => import('@/pages/CookiesView.vue'),
      meta: { layout: 'main' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundView.vue'),
      meta: { layout: 'main' },
    },
  ],
})

let hasValidatedDoctorSession = false

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' }
  }

  if (to.meta.requiresAuth && !hasValidatedDoctorSession) {
    try {
      await api.doctors.getMe()
      hasValidatedDoctorSession = true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      const isAuthError = message.includes('401') || message.includes('403')
      if (isAuthError) {
        api.auth.logout()
        hasValidatedDoctorSession = false
        return { name: 'login' }
      }
    }
  }

  return true
})

export default router
