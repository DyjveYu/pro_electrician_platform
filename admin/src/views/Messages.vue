<template>
  <div class="messages-container">
    <div class="page-header">
      <h2>系统通知管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        发布通知
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="通知类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable>
            <el-option label="系统通知" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="维护通知" value="maintenance" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="定时发布" value="scheduled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMessages">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 通知列表 -->
    <div class="table-section">
      <el-table :data="messages" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_users" label="目标用户" width="120">
          <template #default="{ row }">
            {{ getTargetUsersText(row.target_users) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMessage(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editMessage(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteMessage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingMessage ? '编辑通知' : '发布通知'"
      width="600px"
    >
      <el-form :model="messageForm" :rules="messageRules" ref="messageFormRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="messageForm.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="messageForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入通知内容"
          />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="messageForm.type" placeholder="请选择类型">
            <el-option label="系统通知" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="维护通知" value="maintenance" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="messageForm.priority" placeholder="请选择优先级">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标用户" prop="target_users">
          <el-select v-model="messageForm.target_users" placeholder="请选择目标用户">
            <el-option label="所有用户" value="all" />
            <el-option label="普通用户" value="users" />
            <el-option label="电工用户" value="electricians" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="messageForm.status" placeholder="请选择状态">
            <el-option label="草稿" value="draft" />
            <el-option label="立即发布" value="published" />
            <el-option label="定时发布" value="scheduled" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="messageForm.status === 'scheduled'" label="发布时间" prop="scheduled_at">
          <el-date-picker
            v-model="messageForm.scheduled_at"
            type="datetime"
            placeholder="选择发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMessage" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog v-model="showViewDialog" title="通知详情" width="500px">
      <div v-if="viewingMessage">
        <p><strong>标题：</strong>{{ viewingMessage.title }}</p>
        <p><strong>内容：</strong>{{ viewingMessage.content }}</p>
        <p><strong>类型：</strong>{{ getTypeText(viewingMessage.type) }}</p>
        <p><strong>优先级：</strong>{{ getPriorityText(viewingMessage.priority) }}</p>
        <p><strong>目标用户：</strong>{{ getTargetUsersText(viewingMessage.target_users) }}</p>
        <p><strong>状态：</strong>{{ getStatusText(viewingMessage.status) }}</p>
        <p><strong>创建时间：</strong>{{ formatDate(viewingMessage.created_at) }}</p>
        <p v-if="viewingMessage.published_at"><strong>发布时间：</strong>{{ formatDate(viewingMessage.published_at) }}</p>
        <p v-if="viewingMessage.scheduled_at"><strong>定时发布：</strong>{{ formatDate(viewingMessage.scheduled_at) }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMessages, createMessage, updateMessage, deleteMessage as deleteMessageApi } from '@/api/messages'

const loading = ref(false)
const saving = ref(false)
const messages = ref([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingMessage = ref(null)
const viewingMessage = ref(null)
const messageFormRef = ref()

const filters = reactive({
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const messageForm = reactive({
  title: '',
  content: '',
  type: 'system',
  priority: 'medium',
  target_users: 'all',
  status: 'published',
  scheduled_at: ''
})

const messageRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  target_users: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const loadMessages = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    const response = await getMessages(params)
    messages.value = response.data.messages
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.type = ''
  filters.status = ''
  pagination.page = 1
  loadMessages()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadMessages()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadMessages()
}

const viewMessage = (message) => {
  viewingMessage.value = message
  showViewDialog.value = true
}

const editMessage = (message) => {
  editingMessage.value = message
  Object.assign(messageForm, {
    title: message.title,
    content: message.content,
    type: message.type,
    priority: message.priority,
    target_users: message.target_users,
    status: message.status,
    scheduled_at: message.scheduled_at || ''
  })
  showCreateDialog.value = true
}

const saveMessage = async () => {
  try {
    await messageFormRef.value.validate()
    saving.value = true
    
    if (editingMessage.value) {
      await updateMessage(editingMessage.value.id, messageForm)
      ElMessage.success('通知更新成功')
    } else {
      await createMessage(messageForm)
      ElMessage.success('通知创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
    loadMessages()
  } catch (error) {
    if (error.errors) return // 表单验证错误
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const deleteMessage = async (message) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteMessageApi(message.id)
    ElMessage.success('删除成功')
    loadMessages()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
  }
}

const resetForm = () => {
  Object.assign(messageForm, {
    title: '',
    content: '',
    type: 'system',
    priority: 'medium',
    target_users: 'all',
    status: 'published',
    scheduled_at: ''
  })
  editingMessage.value = null
  messageFormRef.value?.resetFields()
}

const getTypeText = (type) => {
  const typeMap = {
    system: '系统通知',
    activity: '活动通知',
    maintenance: '维护通知',
    urgent: '紧急通知'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    system: '',
    activity: 'success',
    maintenance: 'warning',
    urgent: 'danger'
  }
  return typeMap[type] || ''
}

const getPriorityText = (priority) => {
  const priorityMap = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority) => {
  const priorityMap = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger'
  }
  return priorityMap[priority] || ''
}

const getTargetUsersText = (targetUsers) => {
  const targetMap = {
    all: '所有用户',
    users: '普通用户',
    electricians: '电工用户'
  }
  return targetMap[targetUsers] || targetUsers
}

const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    published: '已发布',
    scheduled: '定时发布'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const statusMap = {
    draft: 'info',
    published: 'success',
    scheduled: 'warning'
  }
  return statusMap[status] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.messages-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.pagination-section {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.el-table {
  border: 1px solid #ebeef5;
}

.el-dialog .el-form {
  padding: 0 20px;
}
</style>