<template>
  <div id="app">
    <!-- 如果当前路径是 /login，只显示登录页，不显示导航栏 -->
    <div v-if="$route.path === '/login'">
      <router-view />
    </div>

    <!-- 其他路径（如 /dashboard），显示带导航栏的布局 -->
    <div v-else class="main-layout">
      <!-- 顶部导航栏 -->
      <el-header class="app-header">
        <div class="header-left">
          <el-icon :size="24" color="#409EFF"><Money /></el-icon>
          <span class="app-title">家庭流水账</span>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" style="margin-right: 8px; background-color: #ecf5ff; color: #409EFF"/>
              {{ userEmail }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="app-main">
        <router-view />
      </el-main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { Money, SwitchButton, ArrowDown, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userEmail = ref<string>('')

// 获取当前登录用户信息
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userEmail.value = user.email || '家庭成员'
  } else {
    // 如果没用户但不在登录页，路由守卫会处理跳转，这里只是防御性编程
    userEmail.value = ''
  }
})

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
      userEmail.value = ''
    } else {
      alert('退出失败：' + error.message)
    }
  }
}
</script>

<style>
/* 全局样式重置，确保全屏 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 布局样式 */
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #ffffff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.app-main {
  padding: 20px;
  overflow-y: auto; /* 内容过多时滚动 */
}

/* 针对 iPad 的优化：防止头部被安全区遮挡 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
  }
  .app-title {
    font-size: 16px;
  }
}
</style>