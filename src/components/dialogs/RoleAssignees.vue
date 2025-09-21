<template>
    <el-dialog v-model="visible" :title="`授权人 - ${currentRole?.name || ''}`" width="1000px" :before-close="handleClose">
        <div class="toolbar">
            <el-input 
                v-model="keyword" 
                placeholder="搜索用户名" 
                clearable 
                style="width: 260px" 
            />
            <el-input 
                v-if="['kb_owner', 'kb_admin'].includes(currentRole?.key)"
                v-model="kbKeyword" 
                placeholder="搜索知识库名称" 
                clearable 
                style="width: 260px; margin-left: 10px;" 
            />
        </div>

        <el-table 
            :data="filteredUserOptions" 
            style="width: 100%" 
            stripe 
        >
            <el-table-column prop="label" label="用户名" width="150" />
            <el-table-column prop="email" label="邮箱" width="200" />
            
            <!-- 超级管理员显示租户信息 -->
            <el-table-column 
                v-if="currentRole?.key === 'super_admin'" 
                prop="tenantName" 
                label="租户名称" 
                width="200" 
            />
            
            <!-- 仅对知识库级角色显示知识库信息 -->
            <el-table-column 
                v-if="['kb_owner', 'kb_admin'].includes(currentRole?.key)" 
                prop="kbName" 
                label="关联知识库" 
                width="200" 
            />
        </el-table>
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const currentRole = ref(null)

const keyword = ref('')
const kbKeyword = ref('')

// 硬编码用户数据
const userDataMap = {
    'platform_admin': [
        { 
            id: 'u1', 
            label: '曾国藩', 
            email: 'admin1@company.com',
            type: ['platform_admin']
        },
        { 
            id: 'u2', 
            label: '松木有', 
            email: 'admin2@company.com',
            type: ['platform_admin']
        }
    ],
    'super_admin': [
        { 
            id: 'u3', 
            label: '奥斯你', 
            email: 'super_admin1@company.com',
            type: ['super_admin'],
            tenantName: '科技创新租户'
        },
        { 
            id: 'u4', 
            label: '现金券', 
            email: 'super_admin2@company.com',
            type: ['super_admin'],
            tenantName: '教育发展租户'
        },
        { 
            id: 'u5', 
            label: '三九七', 
            email: 'super_admin3@company.com',
            type: ['super_admin'],
            tenantName: '医疗服务租户'
        },
        { 
            id: 'u6', 
            label: '十块钱', 
            email: 'super_admin4@company.com',
            type: ['super_admin'],
            tenantName: '金融科技租户'
        },
        { 
            id: 'u7', 
            label: '适配器', 
            email: 'super_admin5@company.com',
            type: ['super_admin'],
            tenantName: '智能制造租户'
        }
    ],
    'kb_owner': [
        { 
            id: 'u5', 
            label: '周年庆', 
            email: 'kb_owner1@company.com',
            type: ['kb_owner'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        },
        { 
            id: 'u6', 
            label: '准确吗', 
            email: 'kb_owner2@company.com',
            type: ['kb_owner'],
            kbId: 'kb2',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u7', 
            label: '打折吧', 
            email: 'kb_owner3@company.com',
            type: ['kb_owner'],
            kbId: 'kb3',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u8', 
            label: '跨学科', 
            email: 'kb_owner4@company.com',
            type: ['kb_owner'],
            kbId: 'kb4',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u9', 
            label: '辛苦钱', 
            email: 'kb_owner5@company.com',
            type: ['kb_owner'],
            kbId: 'kb5',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u10', 
            label: '数据源', 
            email: 'kb_owner6@company.com',
            type: ['kb_owner'],
            kbId: 'kb6',
            kbName: '技术研发知识库'
        }, 
        { 
            id: 'u11', 
            label: '空间转换', 
            email: 'kb_owner7@company.com',
            type: ['kb_owner'],
            kbId: 'kb7',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u12', 
            label: '展开是', 
            email: 'kb_owner8@company.com',
            type: ['kb_owner'],
            kbId: 'kb8',
            kbName: '技术研发知识库'
        }
    ],
    'kb_admin': [
        { 
            id: 'u7', 
            label: '李桂芬', 
            email: 'kb_admin1@company.com',
            type: ['kb_admin'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        },
        { 
            id: 'u8', 
            label: '王博雅', 
            email: 'kb_admin2@company.com',
            type: ['kb_admin'],
            kbId: 'kb2',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u9', 
            label: '赵思远', 
            email: 'kb_admin3@company.com',
            type: ['kb_admin'],
            kbId: 'kb3',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u10', 
            label: '自己去', 
            email: 'kb_admin1@company.com',
            type: ['kb_admin'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        },
        { 
            id: 'u11', 
            label: '发现新', 
            email: 'kb_admin2@company.com',
            type: ['kb_admin'],
            kbId: 'kb2',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u12', 
            label: '小时内', 
            email: 'kb_admin3@company.com',
            type: ['kb_admin'],
            kbId: 'kb3',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u13', 
            label: '顺便说', 
            email: 'kb_admin1@company.com',
            type: ['kb_admin'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        },
        { 
            id: 'u14', 
            label: '王是雅', 
            email: 'kb_admin2@company.com',
            type: ['kb_admin'],
            kbId: 'kb2',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u15', 
            label: '赵辛苦', 
            email: 'kb_admin3@company.com',
            type: ['kb_admin'],
            kbId: 'kb3',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u16', 
            label: '李社区', 
            email: 'kb_admin1@company.com',
            type: ['kb_admin'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        },
        { 
            id: 'u17', 
            label: '王是我', 
            email: 'kb_admin2@company.com',
            type: ['kb_admin'],
            kbId: 'kb2',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u18', 
            label: '赵思是', 
            email: 'kb_admin3@company.com',
            type: ['kb_admin'],
            kbId: 'kb3',
            kbName: '技术研发知识库'
        },
        { 
            id: 'u19', 
            label: '李桂呢', 
            email: 'kb_admin1@company.com',
            type: ['kb_admin'],
            kbId: 'kb1',
            kbName: '企业管理知识库'
        }
    ]
}

const userOptions = computed(() => {
    // 根据当前角色获取对应的用户列表
    const roleKey = currentRole.value?.key
    return userDataMap[roleKey] || []
})

const filteredUserOptions = computed(() => {
    let result = userOptions.value

    // 按用户名筛选
    if (keyword.value) {
        result = result.filter(user => 
            user.label.includes(keyword.value)
        )
    }

    // 对于知识库级角色，按知识库名称筛选
    if (['kb_owner', 'kb_admin'].includes(currentRole.value?.key) && kbKeyword.value) {
        result = result.filter(user => 
            user.kbName && user.kbName.includes(kbKeyword.value)
        )
    }

    return result
})

const open = (row) => {
    currentRole.value = row
    visible.value = true
    
    // 重置筛选条件
    keyword.value = ''
    kbKeyword.value = ''
}

const handleClose = () => {
    visible.value = false
    currentRole.value = null
    keyword.value = ''
    kbKeyword.value = ''
}

defineExpose({ 
    open,
    // 提供一个方法用于判断是否可以打开授权人弹窗
    canOpenAssignees: (role, currentUserRole) => {
        // 平台管理员只能查看平台管理员和超级管理员的授权人
        if (currentUserRole === 'platform_admin') {
            return ['platform_admin', 'super_admin'].includes(role.key)
        }

        // 超级管理员可以查看平台管理员、知识库所有人、知识库管理员和普通用户的授权人
        // 但不能查看超级管理员自身的授权人
        if (currentUserRole === 'super_admin') {
            return role.key !== 'super_admin'
        }

        // 普通用户的授权人需要跳转到用户管理
        if (role.key === 'user') {
            return 'redirect_to_user_management'
        }

        return true
    }
})
</script>

<style scoped>
.toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
</style>


