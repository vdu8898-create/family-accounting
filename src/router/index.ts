import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../utils/supabase'

const routes = [
    { path: '/login', component: () => import('../views/Loginview.vue') },
    { path: '/dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/', redirect: '/login' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 全局前置守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (to.path !== '/login' && !user) {
        next('/login')
    } else if (to.path === '/login' && user) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router