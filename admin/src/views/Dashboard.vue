<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon user-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon electrician-icon">
            <el-icon><Tools /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalElectricians }}</div>
            <div class="stat-label">认证电工</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon order-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalOrders }}</div>
            <div class="stat-label">总工单数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon revenue-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">¥{{ stats.totalRevenue }}</div>
            <div class="stat-label">总收入</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="24" class="charts-row">
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="card-header">
            <h3>工单趋势</h3>
          </div>
          <div class="chart-container" ref="orderTrendChart"></div>
        </div>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="card-header">
            <h3>工单状态分布</h3>
          </div>
          <div class="chart-container" ref="orderStatusChart"></div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 最近活动 -->
    <div class="recent-activity">
      <div class="card-header">
        <h3>最近活动</h3>
        <el-button type="text" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <el-table :data="recentActivities" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActivityTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="user" label="用户" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getStatistics } from '@/api/orders'
import * as echarts from 'echarts'

const orderTrendChart = ref()
const orderStatusChart = ref()

const stats = reactive({
  totalUsers: 0,
  totalElectricians: 0,
  totalOrders: 0,
  totalRevenue: 0
})

const recentActivities = ref([
  {
    time: '2024-01-15 14:30:00',
    type: '新用户注册',
    description: '用户 138****8000 完成注册',
    user: '138****8000'
  },
  {
    time: '2024-01-15 14:25:00',
    type: '工单完成',
    description: '工单 #12345 已完成支付',
    user: '139****9000'
  },
  {
    time: '2024-01-15 14:20:00',
    type: '电工认证',
    description: '电工 张师傅 提交认证申请',
    user: '张师傅'
  }
])

const getActivityTagType = (type) => {
  const typeMap = {
    '新用户注册': 'success',
    '工单完成': 'primary',
    '电工认证': 'warning',
    '系统通知': 'info'
  }
  return typeMap[type] || 'info'
}

const initOrderTrendChart = () => {
  const chart = echarts.init(orderTrendChart.value)
  const option = {
    title: {
      text: '最近7天工单趋势',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1/9', '1/10', '1/11', '1/12', '1/13', '1/14', '1/15']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [12, 19, 15, 22, 18, 25, 20],
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#1890ff'
      }
    }]
  }
  chart.setOption(option)
}

const initOrderStatusChart = () => {
  const chart = echarts.init(orderStatusChart.value)
  const option = {
    title: {
      text: '工单状态分布',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: 35, name: '待接单' },
        { value: 25, name: '进行中' },
        { value: 20, name: '待支付' },
        { value: 20, name: '已完成' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  chart.setOption(option)
}

const loadStatistics = async () => {
  try {
    const response = await getStatistics()
    if (response.code === 200) {
      Object.assign(stats, response.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 使用模拟数据
    Object.assign(stats, {
      totalUsers: 1234,
      totalElectricians: 89,
      totalOrders: 567,
      totalRevenue: 123456
    })
  }
}

const refreshData = () => {
  loadStatistics()
}

onMounted(async () => {
  await loadStatistics()
  await nextTick()
  initOrderTrendChart()
  initOrderStatusChart()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.electrician-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.order-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.revenue-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.charts-row {
  margin-bottom: 24px;
}

.chart-card,
.recent-activity {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.chart-container {
  height: 300px;
}

.recent-activity {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stat-card {
    padding: 16px;
    height: 80px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>