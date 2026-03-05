<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 左侧：记账表单 -->
      <el-col :xs="24" :md="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>✍️ 新增记账</span>
            </div>
          </template>
          
          <el-form :model="txForm" label-position="top">
            <el-form-item label="金额">
              <el-input-number v-model="txForm.amount" :precision="2" :step="1" style="width: 100%" placeholder="0.00" />
            </el-form-item>

            <el-form-item label="类型">
              <el-select v-model="txForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="餐饮" value="餐饮" />
                <el-option label="交通" value="交通" />
                <el-option label="购物" value="购物" />
                <el-option label="娱乐" value="娱乐" />
                <el-option label="工资" value="工资" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>

            <el-form-item label="收支方向">
              <el-radio-group v-model="txForm.is_income">
                <el-radio :label="false">支出</el-radio>
                <el-radio :label="true">收入</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="日期">
              <el-date-picker v-model="txForm.transaction_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>

            <el-form-item label="备注 (支持AI识别)">
              <el-input v-model="txForm.note" type="textarea" rows="3" placeholder="例如：昨天在超市买水果花了50元" />
              <el-button link type="primary" size="small" @click="analyzeWithAI" :loading="aiLoading">
                🤖 AI 智能解析
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" style="width: 100%" :loading="submitting" @click="submitTransaction">
                保存记录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：最近记录 & 图表占位 -->
      <el-col :xs="24" :md="16">
        <el-card class="box-card" style="margin-bottom: 20px;">
          <template #header>
            <span>📊 本月概览 (图表区)</span>
          </template>
          <div ref="chartRef" style="height: 300px; width: 100%;"></div>
        </el-card>

        <el-card class="box-card">
          <template #header>
            <span>📝 最近记录</span>
          </template>
          <el-table :data="recentTransactions" style="width: 100%" stripe>
            <el-table-column prop="transaction_date" label="日期" width="100" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="note" label="备注" />
            <el-table-column prop="amount" label="金额" align="right">
              <template #default="scope">
                <span :style="{ color: scope.row.is_income ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
                  {{ scope.row.is_income ? '+' : '-' }}{{ scope.row.amount }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { supabase } from '@/utils/supabase'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// --- 表单数据 ---
const submitting = ref(false)
const aiLoading = ref(false)
const txForm = reactive({
  amount: 0,
  type: '',
  is_income: false,
  transaction_date: new Date(),
  note: ''
})

// --- 列表数据 ---
const recentTransactions = ref<any[]>([])

// --- 图表实例 ---
const chartRef = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

// --- 提交数据 ---
const submitTransaction = async () => {
  if (!txForm.amount || !txForm.type) {
    alert('请填写金额和类型')
    return
  }
  
  submitting.value = true
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        amount: txForm.amount,
        type: txForm.type,
        is_income: txForm.is_income,
        transaction_date: dayjs(txForm.transaction_date).format('YYYY-MM-DD'),
        note: txForm.note,
        // member_id: 这里可以从 auth.user 关联，暂时留空或硬编码测试
      })
    
    if (error) throw error
    
    alert('记账成功！')
    // 重置表单
    txForm.amount = 0
    txForm.note = ''
    txForm.type = ''
    
    // 刷新列表和图表
    fetchTransactions()
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    submitting.value = false
  }
}

// --- AI 模拟解析 (实际需调用 Edge Function) ---
const analyzeWithAI = async () => {
  if (!txForm.note) return
  aiLoading.value = true
  
  // 模拟延迟
  setTimeout(() => {
    // 这里只是演示逻辑，实际应调用后端 API
    if (txForm.note.includes('吃') || txForm.note.includes('饭')) {
      txForm.type = '餐饮'
      txForm.is_income = false
      // 尝试提取数字 (简单正则)
      const match = txForm.note.match(/(\d+(\.\d+)?)/)
      if (match) txForm.amount = parseFloat(match[0])
    } else if (txForm.note.includes('工资') || txForm.note.includes('赚')) {
      txForm.type = '工资'
      txForm.is_income = true
    }
    
    aiLoading.value = false
    alert('AI 解析完成，请确认信息。')
  }, 1000)
}

// --- 获取数据 ---
const fetchTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(10)
  
  if (!error && data) {
    recentTransactions.value = data
    renderChart(data)
  }
}

// --- 渲染图表 ---
const renderChart = (data: any[]) => {
  if (!chartRef.value) return
  if (!myChart) myChart = echarts.init(chartRef.value)
  
  // 简单处理：按类型统计支出
  const stats: Record<string, number> = {}
  data.forEach(item => {
    if (!item.is_income) {
      stats[item.type] = (stats[item.type] || 0) + item.amount
    }
  })
  
  const option = {
    tooltip: { trigger: 'item' },
    title: { text: '近期支出分布', left: 'center' },
    series: [
      {
        name: '支出类型',
        type: 'pie',
        radius: '50%',
        data: Object.keys(stats).map(key => ({ value: stats[key], name: key })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }
    ]
  }
  
  myChart.setOption(option)
}

// 生命周期
onMounted(() => {
  fetchTransactions()
  window.addEventListener('resize', () => myChart?.resize())
})
</script>

<style scoped>
.dashboard { padding: 20px; }
.box-card { margin-bottom: 20px; }
</style>