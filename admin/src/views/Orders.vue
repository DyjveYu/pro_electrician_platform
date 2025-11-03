<template>
  <div class="orders-page">
    <div class="page-card">
      <!-- 页面标题和操作栏 -->
      <div class="table-toolbar">
        <div class="left">
          <h2>工单管理</h2>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索工单号或用户手机号"
            style="width: 300px"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="searchForm.status"
            placeholder="工单状态"
            style="width: 120px"
            clearable
            @change="handleSearch"
          >
            <el-option label="待接单" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="待支付" value="pending_payment" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="handleSearch"
          />
          
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
        
        <div class="right">
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ orderStats.total }}</div>
            <div class="stat-label">总工单数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ orderStats.pending }}</div>
            <div class="stat-label">待接单</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ orderStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ orderStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 工单列表表格 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="order_no" label="工单号" width="150" />
        
        <el-table-column prop="user_nickname" label="用户昵称" width="130" />
        
        <el-table-column prop="electrician_nickname" label="电工" width="100">
          <template #default="{ row }">
            <span>{{ row.electrician_nickname || '未分配' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="service_type_name" label="服务类型" width="120" />
        
        <el-table-column label="问题描述" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.title || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="服务地址" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.service_address || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="final_amount" label="金额" width="100">
          <template #default="{ row }">
            <span v-if="row.final_amount">¥{{ row.final_amount }}</span>
            <span v-else class="text-muted">未报价</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="completed_at" label="完成时间" width="160">
          <template #default="{ row }">
            {{ row.completed_at ? formatDateTime(row.completed_at) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            
            <el-dropdown @command="(command) => handleOrderAction(command, row)">
              <el-button type="text" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="cancel" v-if="row.status === 'pending' || row.status === 'in_progress'">
                    取消工单
                  </el-dropdown-item>
                  <el-dropdown-item command="force_complete" v-if="row.status === 'in_progress'">
                    强制完成
                  </el-dropdown-item>
                  <el-dropdown-item command="refund" v-if="row.status === 'completed'">
                    申请退款
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="工单详情"
      width="900px"
    >
      <div v-if="currentOrder" class="order-detail">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-descriptions title="基本信息" :column="1" border>
              <el-descriptions-item label="工单号">{{ currentOrder.order_number }}</el-descriptions-item>
              <el-descriptions-item label="服务类型">{{ currentOrder.service_type }}</el-descriptions-item>
              <el-descriptions-item label="问题描述">{{ currentOrder.description }}</el-descriptions-item>
              <el-descriptions-item label="服务地址">{{ currentOrder.address }}</el-descriptions-item>
              <el-descriptions-item label="联系人">{{ currentOrder.contact_name }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentOrder.contact_phone }}</el-descriptions-item>
              <el-descriptions-item label="预约时间">{{ currentOrder.appointment_time ? formatDateTime(currentOrder.appointment_time) : '随时' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
          
          <el-col :span="12">
            <el-descriptions title="状态信息" :column="1" border>
              <el-descriptions-item label="当前状态">
                <el-tag :type="getStatusTagType(currentOrder.status)">
                  {{ getStatusText(currentOrder.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="用户">{{ currentOrder.user_phone }}</el-descriptions-item>
              <el-descriptions-item label="电工">{{ currentOrder.electrician_name || '未分配' }}</el-descriptions-item>
              <el-descriptions-item label="报价金额">
                <span v-if="currentOrder.amount">¥{{ currentOrder.amount }}</span>
                <span v-else class="text-muted">未报价</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="接单时间">{{ currentOrder.accepted_at ? formatDateTime(currentOrder.accepted_at) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{ currentOrder.completed_at ? formatDateTime(currentOrder.completed_at) : '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        
        <!-- 问题图片 -->
        <div v-if="currentOrder.images && currentOrder.images.length > 0" class="images-section">
          <h4>问题图片</h4>
          <div class="images-grid">
            <el-image
              v-for="(image, index) in currentOrder.images"
              :key="index"
              :src="image"
              :preview-src-list="currentOrder.images"
              fit="cover"
              class="order-image"
            />
          </div>
        </div>
        
        <!-- 维修记录 -->
        <div v-if="currentOrder.repair_description" class="repair-section">
          <h4>维修记录</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="维修内容">{{ currentOrder.repair_description }}</el-descriptions-item>
            <el-descriptions-item label="维修时间">{{ currentOrder.repair_time ? formatDateTime(currentOrder.repair_time) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="维修费用">¥{{ currentOrder.repair_amount || 0 }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <!-- 评价信息 -->
        <div v-if="currentOrder.review" class="review-section">
          <h4>用户评价</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="评分">
              <el-rate v-model="currentOrder.review.rating" disabled />
            </el-descriptions-item>
            <el-descriptions-item label="评价内容">{{ currentOrder.review.content }}</el-descriptions-item>
            <el-descriptions-item label="评价时间">{{ formatDateTime(currentOrder.review.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, updateOrderStatus, getOrderDetail } from '@/api/orders'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const orderList = ref([])
const selectedOrders = ref([])
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const orderStats = reactive({
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0
})

const getStatusTagType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'in_progress': 'primary',
    'pending_payment': 'info',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'pending': '待接单',
    'in_progress': '进行中',
    'pending_payment': '待支付',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知'
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadOrderList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.keyword,
      status: searchForm.status
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0].toISOString().split('T')[0]
      params.end_date = searchForm.dateRange[1].toISOString().split('T')[0]
    }
    
    const response = await getOrderList(params)
    if (response.code === 200) {
      orderList.value = response.data.orders
      pagination.total = response.data.total
      Object.assign(orderStats, response.data.stats || {})
    }
  } catch (error) {
    console.error('加载工单列表失败:', error)
    ElMessage.error('加载工单列表失败: ' + error.message)
    orderList.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadOrderList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadOrderList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadOrderList()
}

const handleSelectionChange = (selection) => {
  selectedOrders.value = selection
}

const handleViewDetail = async (order) => {
  try {
    const response = await getOrderDetail(order.id)
    if (response.code === 200) {
      currentOrder.value = response.data
    } else {
      currentOrder.value = order
    }
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取工单详情失败:', error)
    currentOrder.value = order
    detailDialogVisible.value = true
  }
}

const handleOrderAction = async (command, order) => {
  switch (command) {
    case 'cancel':
      await handleCancelOrder(order)
      break
    case 'force_complete':
      await handleForceComplete(order)
      break
    case 'refund':
      await handleRefund(order)
      break
  }
}

const handleCancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消工单 ${order.order_number} 吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await updateOrderStatus(order.id, { status: 'cancelled' })
    if (response.code === 200) {
      ElMessage.success('工单已取消')
      loadOrderList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消工单失败:', error)
      ElMessage.error('取消工单失败')
    }
  }
}

const handleForceComplete = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要强制完成工单 ${order.order_number} 吗？`,
      '确认强制完成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await updateOrderStatus(order.id, { status: 'completed' })
    if (response.code === 200) {
      ElMessage.success('工单已强制完成')
      loadOrderList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('强制完成工单失败:', error)
      ElMessage.error('强制完成工单失败')
    }
  }
}

const handleRefund = async (order) => {
  ElMessage.info('退款功能开发中...')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped>
.orders-page {
  padding: 0;
}

.table-toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.table-toolbar .left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.table-toolbar .left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: box-shadow 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.order-detail {
  padding: 16px 0;
}

.images-section,
.repair-section,
.review-section {
  margin-top: 24px;
}

.images-section h4,
.repair-section h4,
.review-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.order-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.text-muted {
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-toolbar .left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-toolbar .left h2 {
    margin-bottom: 8px;
  }
  
  .stats-row .el-col {
    margin-bottom: 16px;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .order-image {
    width: 100px;
    height: 100px;
  }
}
</style>