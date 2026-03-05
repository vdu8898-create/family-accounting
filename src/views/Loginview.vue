<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>📒 家庭流水账</h2>
          <p>欢迎回来</p>
        </div>
      </template>

      <el-form :model="form" label-width="0" size="large">
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱地址" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" style="width: 100%" :loading="loading" @click="handleAuth">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="switch-mode">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <el-link type="primary" @click="isLogin = !isLogin">
          {{ isLogin ? '去注册' : '去登录' }}
        </el-link>
      </div>
      
      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-top: 10px"/>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {supabase} from '../utils/supabase'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    let result
    if (isLogin.value) {
      // 登录
      result = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })
    } else {
      // 注册
      result = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })
      alert('注册成功！请检查邮箱验证链接（如果开启了邮箱验证）。若未开启，可直接登录。')
    }

    if (result.error) throw result.error
    
    if (result.data.user) {
      router.push('/dashboard')
    }
  } catch (e: any) {
    errorMsg.value = e.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}
.login-card {
  width: 400px;
}
.card-header {
  text-align: center;
}
.card-header h2 { margin: 0; color: #409EFF; }
.card-header p { margin: 5px 0 0; color: #666; font-size: 14px; }
.switch-mode {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}
</style>