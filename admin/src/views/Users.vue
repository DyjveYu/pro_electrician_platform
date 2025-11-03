<template>
  <div class="users-page">
    <div class="page-card">
      <!-- 页面标题和操作栏 -->
      <div class="table-toolbar">
        <div class="left">
          <h2>用户管理</h2>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户手机号或昵称"
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
            placeholder="用户状态"
            style="width: 120px"
            clearable
            @change="handleSearch"
          >
            <el-option label="正常" value="active" />
            <el-option label="封禁" value="banned" />
          </el-select>
          
          <el-select
            v-model="searchForm.role"
            placeholder="用户角色"
            style="width: 120px"
            clearable
            @change="handleSearch"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="电工" value="electrician" />
          </el-select>
          
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
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
      
      <!-- 用户列表表格 -->
      <el-table
        v-loading="loading"
        :data="userList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="phone" label="手机号" width="130" />
        
        <el-table-column prop="nickname" label="昵称" width="120">
          <template #default="{ row }">
            <span>{{ row.nickname || '未设置' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="current_role" label="当前角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.current_role === 'electrician' ? 'warning' : 'primary'">
              {{ row.current_role === 'electrician' ? '电工' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="can_be_electrician" label="电工认证" width="100">
          <template #default="{ row }">
            <el-tag :type="row.can_be_electrician ? 'success' : 'info'">
              {{ row.can_be_electrician ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="last_login_at" label="最后登录" width="160">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              type="danger"
              size="small"
              @click="handleBanUser(row)"
            >
              封禁
            </el-button>
            
            <el-button
              v-else
              type="success"
              size="small"
              @click="handleUnbanUser(row)"
            >
              解封
            </el-button>
            
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
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
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="当前角色">
            <el-tag :type="currentUser.current_role === 'electrician' ? 'warning' : 'primary'">
              {{ currentUser.current_role === 'electrician' ? '电工' : '用户' }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="电工认证">
            <el-tag :type="currentUser.can_be_electrician ? 'success' : 'info'">
              {{ currentUser.can_be_electrician ? '已认证' : '未认证' }}
            </el-tag>
          </el-descriptions-item>
       
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentUser.status)">
              {{ getStatusText(currentUser.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ currentUser.last_login_at ? formatDate(currentUser.last_login_at) : '从未登录' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserList, banUser, unbanUser, getUserDetail } from '@/api/users'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const userList = ref([])
const selectedUsers = ref([])
const detailDialogVisible = ref(false)
const currentUser = ref(null)

const searchForm = reactive({
  keyword: '',
  status: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const getStatusTagType = (status) => {
  const typeMap = {
    'active': 'success',
    'banned': 'danger',
    'inactive': 'warning'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'active': '正常',
    'banned': '封禁',
    'inactive': '未激活'
  }
  return textMap[status] || '未知'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    const response = await getUserList(params)
    if (response.code === 200) {
      userList.value = response.data.users || response.data.list || []
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    // 使用模拟数据
    userList.value = [
      {
        id: 1,
        phone: '13800138000',
        nickname: '测试用户1',
        current_role: 'user',
        can_be_electrician: false,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        phone: '13900139000',
        nickname: '张师傅',
        current_role: 'electrician',
        can_be_electrician: true,
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
        last_login_at: '2024-01-15T09:15:00Z'
      }
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUserList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    role: ''
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadUserList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadUserList()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handleBanUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 ${user.phone} 吗？`,
      '确认封禁',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await banUser(user.id)
    if (response.code === 200) {
      ElMessage.success('用户封禁成功')
      loadUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('封禁用户失败:', error)
      ElMessage.error('封禁用户失败')
    }
  }
}

const handleUnbanUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封用户 ${user.phone} 吗？`,
      '确认解封',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await unbanUser(user.id)
    if (response.code === 200) {
      ElMessage.success('用户解封成功')
      loadUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解封用户失败:', error)
      ElMessage.error('解封用户失败')
    }
  }
}

const handleViewDetail = async (user) => {
  try {
    const response = await getUserDetail(user.id)
    if (response.code === 200) {
      currentUser.value = response.data
    } else {
      currentUser.value = user
    }
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取用户详情失败:', error)
    currentUser.value = user
    detailDialogVisible.value = true
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.users-page {
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

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.user-detail {
  padding: 16px 0;
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
}
</style>