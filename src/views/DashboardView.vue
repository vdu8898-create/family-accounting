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
              <el-select v-model="txForm.type" placeholder="选择类型" style="width: 100%" :loading="loadingOptions">
                <el-option v-for="item in categoryOptions" :key="item.name" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>

            <el-form-item label="成员">
              <el-select v-model="txForm.member_id" placeholder="选择成员" style="width: 100%" :loading="loadingOptions">
                <el-option v-for="item in memberOptions" :key="item.id" :label="item.name" :value="item.id" />
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
            <el-table-column prop="members.name" label="成员" width="80" />
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
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// --- 表单数据 ---
const submitting = ref(false)
const aiLoading = ref(false)
const txForm = reactive({
  amount: 0,
  type: '',
  member_id: '',
  is_income: false,
  transaction_date: new Date(),
  note: ''
})
// 1. 定义数据类型接口
interface CategoryItem {
  name: string;
  // 如果数据库里还有其他字段想用到，可以在这里加，比如 id?: number;
}

interface MemberItem {
  id: number;
  name: string;
}

// 存储从数据库拉取的列表
const categoryOptions = ref<CategoryItem[]>([])
const memberOptions = ref<MemberItem[]>([])
const loadingOptions = ref(false);

// --- 列表数据 ---
const recentTransactions = ref<any[]>([])

// --- 图表实例 ---
const chartRef = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

// --- 提交数据 ---
const submitTransaction = async () => {
  if (!txForm.amount || !txForm.type || !txForm.member_id) {
    alert('请填写金额，类型和成员')
    return
  }
  
  submitting.value = true
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        amount: txForm.amount,
        type: txForm.type,
        member_id: txForm.member_id,
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
const fetchOptions = async () => {
  loadingOptions.value = true;
  try {
    // 1. 获取分类列表 (只取启用的)
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('name') // 只需要 name，如果需要 value 不同，可以选 id
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (catErr) throw catErr;
    console.log(cats)
    categoryOptions.value = cats || [];

    // 2. 获取成员列表
    const { data: mems, error: memErr } = await supabase
      .from('members')
      .select('id, name') // 需要 id 作为值，name 作为显示
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (memErr) throw memErr;
    memberOptions.value = mems || [];

  } catch (error) {
    console.error('加载下拉选项失败:', error);
    // 这里可以加一个 ElMessage 提示用户
  } finally {
    loadingOptions.value = false;
  }
};
const fetchTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
       members!inner(id, name)  // 语法：表名!连接类型(需要的字段)
    `)
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
  fetchOptions()
  window.addEventListener('resize', () => myChart?.resize())
})
</script>

<style scoped>
.dashboard { padding: 20px; }
.box-card { margin-bottom: 20px; }
</style>