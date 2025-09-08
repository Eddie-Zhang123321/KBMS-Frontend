<template>
    <el-dialog v-model="visible" title="批量导入用户" width="500px" :before-close="handleClose">
        <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :file-list="fileList"
            :limit="1"
            accept=".csv"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            class="upload-demo"
            action=""
            :on-drop="handleDrop"
            :on-dragover="handleDragover"
        >
            <div
                class="drag-area"
                @drop.prevent="handleDrop"
                @dragover.prevent="handleDragover"
                @click="triggerUpload"
            >
                <div>
                    点击上传 CSV 文件<el-icon><Upload /></el-icon><br>仅支持 .csv 格式文件，最大 5MB
                </div>
            </div>
            <template #tip>
                <div class="el-upload__tip">
                    文件应包含字段：userName, email, department, tenantSuperAdmin, createTime<br>
                    注意：id和status字段由系统自动生成，导入的用户默认状态为"开通"
                </div>
            </template>
        </el-upload>

        <div class="result-area" v-if="uploadResult">
            {{ uploadResult }}
        </div>

        <div class="button-row">
            <el-button @click="downloadTemplate" class="upload-template">下载模板</el-button>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" :disabled="fileList.length === 0 || !isFileValid" @click="submitUpload">上传</el-button>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import { batchImportUsers } from '@/api/user'; // 引入批量导入接口

const visible = ref(false);
const uploadRef = ref(null);
const fileList = ref([]);
const uploadResult = ref('');

const formData = reactive({
    file: null
});

const isFileValid = computed(() => {
    if (fileList.value.length === 0) return false;
    const file = fileList.value[0].raw;
    return file && file.size <= 5 * 1024 * 1024 && isCsvFile(file.name); // 5MB and .csv check
});

// 检查文件是否为 .csv
const isCsvFile = (fileName) => {
    return fileName.toLowerCase().endsWith('.csv');
};

// 打开弹窗
const open = () => {
    visible.value = true;
    fileList.value = [];
    uploadResult.value = '';
};

// 关闭弹窗
const handleClose = () => {
    fileList.value = [];
    uploadResult.value = '';
    visible.value = false;
};

// 处理文件变化
const handleFileChange = (file, fileListParam) => {
    fileList.value = fileListParam;
    formData.file = file.raw;
};

// 处理文件移除
const handleFileRemove = () => {
    formData.file = null;
    fileList.value = [];
};

// 处理拖拽
const handleDrop = (event) => {
    const file = event.dataTransfer.files[0];
    if (file && isCsvFile(file.name) && file.size <= 5 * 1024 * 1024) {
        fileList.value = [{ raw: file, name: file.name, status: 'ready' }];
        handleFileChange({ raw: file }, fileList.value);
    } else {
        ElMessage.error('请上传有效的 CSV 文件（最大 5MB）');
    }
};

// 处理拖拽进入
const handleDragover = (event) => {
    event.preventDefault();
};

// 触发上传
const triggerUpload = () => {
    uploadRef.value.$refs.input.click();
};

// 下载模板
const downloadTemplate = () => {
    // 创建CSV模板数据
    const headers = ['userName', 'email', 'department', 'tenantSuperAdmin', 'createTime'];
    const sampleData = [
        ['zhangsan', 'zhangsan@example.com', '技术部', 'false', '2024-01-15 14:30:00'],
        ['lisi', 'lisi@example.com', '销售部', 'true', '2024-01-15 15:30:00'],
        ['wangwu', 'wangwu@example.com', '人事部', 'false', '2024-01-15 16:30:00']
    ];
    
    // 创建CSV内容
    const csvContent = '\ufeff' + [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    ElMessage.success('模板下载成功');
};

// 提交上传
const submitUpload = async () => {
    if (!formData.file || !isFileValid.value) {
        ElMessage.warning('请选择一个有效的 CSV 文件（最大 5MB）');
        return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', formData.file);

    try {
        console.log('开始批量导入用户，文件:', formData.file.name, '大小:', formData.file.size);
        
        const response = await batchImportUsers(formDataToSend);
        console.log('批量导入响应:', response);
        
        // 处理响应数据
        const result = response?.data || response;
        
        if (result && result.importedCount !== undefined) {
            const importedCount = result.importedCount || 0;
            
            if (importedCount > 0) {
                uploadResult.value = `批量导入成功，新增 ${importedCount} 个用户`;
                ElMessage.success(uploadResult.value);
                
                // 通知父组件刷新用户列表
                emit('import-success');
                handleClose();
            } else {
                uploadResult.value = '没有成功导入任何用户';
                ElMessage.warning(uploadResult.value);
            }
        } else {
            uploadResult.value = `批量导入失败: ${result?.message || '未知错误'}`;
            ElMessage.error(uploadResult.value);
        }
    } catch (error) {
        console.error('上传失败:', error);
        uploadResult.value = '上传过程中发生错误，请稍后重试';
        ElMessage.error(uploadResult.value);
    }
};

// 暴露方法给父组件
defineExpose({ open });
defineEmits(['import-success']);
</script>

<style scoped>
.upload-demo {
    margin-bottom: 20px;
    width: 100%;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    background-color: #f9f9f9;
    transition: border-color 0.3s;
}

.upload-demo:hover,
.upload-demo.dragover {
    border-color: #409eff;
    background-color: #e6f0fa;
}

.drag-area {
    text-align: center;
    cursor: pointer;
}

.drag-area div {
    font-size: 14px;
    color: #606266;
}

.el-upload__tip {
    font-size: 12px;
    color: #999;
    margin-top: 10px;
}

.result-area {
    margin: 15px 0;
    color: #333;
    font-size: 14px;
}

.button-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.upload-template {
    color: white;
    background-color: #12B76A;
    position: absolute;
    left: 15px;
}
</style>