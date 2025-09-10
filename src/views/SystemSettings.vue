<template>
    <div class="system-settings">
        <el-card v-if="canSeePlatform" class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>平台管理员设置（全局规则 + 上限阈值）</span>
                </div>
            </template>
            <el-form ref="platformFormRef" :model="platformForm">
                <el-row :gutter="16">
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>安全与认证</span></template>
                            <el-form-item label="token有效范围（分钟）">
                                <div class="inline-inputs">
                                    <span>最小值：</span>
                                    <el-input-number v-model="platformForm.securityAuth.tokenMin" :min="1" :max="100000"
                                        style="width: 100%;" />
                                    <span class="spacer" />
                                    <span>最大值：</span>
                                    <el-input-number v-model="platformForm.securityAuth.tokenMax"
                                        :min="platformForm.securityAuth.tokenMin" :max="200000" style="width: 100%;" />
                                </div>
                            </el-form-item>
                            <el-form-item label="最大登录失败次数上限">
                                <el-input-number v-model="platformForm.securityAuth.maxLoginFailures" :min="1"
                                    :max="100" />
                            </el-form-item>
                            <el-form-item label="密码强度最低要求">
                                <el-select v-model="platformForm.securityAuth.passwordStrength" placeholder="请选择">
                                    <el-option label="低" value="low" />
                                    <el-option label="中" value="medium" />
                                    <el-option label="高" value="high" />
                                </el-select>
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>系统行为</span></template>
                            <el-form-item label="上传文件大小上限（MB）">
                                <el-input-number v-model="platformForm.systemBehavior.maxUploadSizeMB" :min="1"
                                    :max="102400" />
                            </el-form-item>
                            <el-form-item label="是否允许批量上传">
                                <el-radio-group v-model="platformForm.systemBehavior.allowBatchUpload">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="日志保留天数上限">
                                <el-input-number v-model="platformForm.systemBehavior.logRetentionDaysMax" :min="1"
                                    :max="3650" />
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>租户配额</span></template>
                            <el-form-item label="单租户最大知识库数上限">
                                <el-input-number v-model="platformForm.tenantQuota.kbLimitPerTenant" :min="1"
                                    :max="100000" />
                            </el-form-item>
                            <el-form-item label="单租户最大用户数上限">
                                <el-input-number v-model="platformForm.tenantQuota.userLimitPerTenant" :min="1"
                                    :max="1000000" />
                            </el-form-item>
                            <el-form-item label="单租户最大存储容量上限（GB）">
                                <el-input-number v-model="platformForm.tenantQuota.storageLimitPerTenantGB" :min="1"
                                    :max="1048576" />
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>高级功能控制</span></template>
                            <el-form-item label="是否开放自主注册">
                                <el-radio-group v-model="platformForm.advancedControls.allowSelfRegister">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="是否启用知识库外部嵌入">
                                <el-radio-group v-model="platformForm.advancedControls.enableKbEmbed">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-card>
                    </el-col>
                </el-row>
                <div class="actions">
                    <el-button @click="resetPlatformToDefaults">恢复默认值</el-button>
                    <el-button type="primary" @click="savePlatformSettings">保存设置</el-button>
                </div>
            </el-form>
        </el-card>

        <el-card v-if="canSeeTenant" class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>此租户超级管理员设置（在平台范围内细化）</span>
                </div>
            </template>
            <el-form ref="tenantFormRef" :model="tenantForm" :rules="tenantRules">
                <el-row :gutter="16">
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>安全与认证</span></template>
                            <el-form-item label="token有效期（分钟）" prop="securityAuth.tokenMinutes">
                                <el-input-number v-model="tenantForm.securityAuth.tokenMinutes" :min="1"
                                    :max="200000" />
                            </el-form-item>
                            <el-form-item label="最大登录失败次数" prop="securityAuth.maxLoginFailures">
                                <el-input-number v-model="tenantForm.securityAuth.maxLoginFailures" :min="1"
                                    :max="100" />
                            </el-form-item>
                            <el-form-item label="密码强度最低" prop="securityAuth.passwordStrength">
                                <el-select v-model="tenantForm.securityAuth.passwordStrength" placeholder="请选择">
                                    <el-option label="低" value="low" />
                                    <el-option label="中" value="medium" />
                                    <el-option label="高" value="high" />
                                </el-select>
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>系统行为</span></template>
                            <el-form-item label="单个文件上传大小上限（MB）" prop="systemBehavior.singleFileMaxUploadMB">
                                <el-input-number v-model="tenantForm.systemBehavior.singleFileMaxUploadMB" :min="1"
                                    :max="102400" />
                            </el-form-item>
                            <el-form-item label="日志保留天数" prop="systemBehavior.logRetentionDays">
                                <el-input-number v-model="tenantForm.systemBehavior.logRetentionDays" :min="1"
                                    :max="3650" />
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>租户配额</span></template>
                            <el-form-item label="知识库数量限制" prop="tenantQuota.kbLimit">
                                <el-input-number v-model="tenantForm.tenantQuota.kbLimit" :min="1" :max="100000" />
                            </el-form-item>
                            <el-form-item label="用户数量限制" prop="tenantQuota.userLimit">
                                <el-input-number v-model="tenantForm.tenantQuota.userLimit" :min="1" :max="1000000" />
                            </el-form-item>
                        </el-card>
                    </el-col>
                    <el-col :span="12" :xs="24" :sm="12">
                        <el-card class="section-card" shadow="never">
                            <template #header><span>功能开关</span></template>
                            <el-form-item label="是否允许自主注册" prop="featureToggles.allowSelfRegister">
                                <el-radio-group v-model="tenantForm.featureToggles.allowSelfRegister">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="用户信息是否可编辑">
                                <el-radio-group v-model="tenantForm.featureToggles.userEditable">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="是否启用知识库外部嵌入" prop="featureToggles.enableKbEmbed">
                                <el-radio-group v-model="tenantForm.featureToggles.enableKbEmbed">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-card>
                    </el-col>
                </el-row>
                <div class="actions">
                    <el-button @click="resetTenantToDefaults">恢复默认值</el-button>
                    <el-button type="primary" @click="saveTenantSettings">保存设置</el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
// ... (脚本部分保持不变) ...
import { reactive, computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const canSeePlatform = computed(() => userStore.platformAdmin)
const canSeeTenant = computed(() => userStore.tenantSuperAdmin)

// 表单引用
const platformFormRef = ref(null)
const tenantFormRef = ref(null)

const platformDefaults = {
    securityAuth: {
        tokenMin: 30,
        tokenMax: 1440,
        maxLoginFailures: 10,
        passwordStrength: 'medium'
    },
    systemBehavior: {
        maxUploadSizeMB: 200,
        allowBatchUpload: true,
        logRetentionDaysMax: 365
    },
    tenantQuota: {
        kbLimitPerTenant: 100,
        userLimitPerTenant: 2000,
        storageLimitPerTenantGB: 500
    },
    advancedControls: {
        allowSelfRegister: false,
        enableKbEmbed: true
    }
}
const tenantDefaults = {
    securityAuth: {
        tokenMinutes: 60,
        maxLoginFailures: 5,
        passwordStrength: 'medium'
    },
    systemBehavior: {
        singleFileMaxUploadMB: 150,
        logRetentionDays: 180
    },
    tenantQuota: {
        kbLimit: 50,
        userLimit: 800
    },
    featureToggles: {
        allowSelfRegister: false,
        userEditable: true,
        enableKbEmbed: true
    }
}

const platformForm = reactive(JSON.parse(JSON.stringify(platformDefaults)))
const tenantForm = reactive(JSON.parse(JSON.stringify(tenantDefaults)))

const strengthOrder = { low: 1, medium: 2, high: 3 }

const tenantRules = computed(() => {
    return {
        'securityAuth.tokenMinutes': [{
            validator: (rule, value, callback) => {
                if (value < platformForm.securityAuth.tokenMin || value > platformForm.securityAuth.tokenMax) {
                    callback(new Error(`租户 token 有效期需在 ${platformForm.securityAuth.tokenMin} - ${platformForm.securityAuth.tokenMax} 分钟范围内`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'securityAuth.maxLoginFailures': [{
            validator: (rule, value, callback) => {
                if (value > platformForm.securityAuth.maxLoginFailures) {
                    callback(new Error(`租户最大登录失败次数不得超过平台上限 ${platformForm.securityAuth.maxLoginFailures}`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'securityAuth.passwordStrength': [{
            validator: (rule, value, callback) => {
                if (strengthOrder[value] < strengthOrder[platformForm.securityAuth.passwordStrength]) {
                    callback(new Error(`租户密码强度不得低于平台最低要求（${platformForm.securityAuth.passwordStrength}）`));
                } else {
                    callback();
                }
            }, trigger: 'change'
        }],
        'systemBehavior.singleFileMaxUploadMB': [{
            validator: (rule, value, callback) => {
                if (value > platformForm.systemBehavior.maxUploadSizeMB) {
                    callback(new Error(`租户单文件上传大小上限不得超过平台上限 ${platformForm.systemBehavior.maxUploadSizeMB} MB`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'systemBehavior.logRetentionDays': [{
            validator: (rule, value, callback) => {
                if (value > platformForm.systemBehavior.logRetentionDaysMax) {
                    callback(new Error(`租户日志保留天数不得超过平台上限 ${platformForm.systemBehavior.logRetentionDaysMax} 天`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'tenantQuota.kbLimit': [{
            validator: (rule, value, callback) => {
                if (value > platformForm.tenantQuota.kbLimitPerTenant) {
                    callback(new Error(`租户知识库数量限制不得超过平台上限 ${platformForm.tenantQuota.kbLimitPerTenant}`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'tenantQuota.userLimit': [{
            validator: (rule, value, callback) => {
                if (value > platformForm.tenantQuota.userLimitPerTenant) {
                    callback(new Error(`租户用户数量限制不得超过平台上限 ${platformForm.tenantQuota.userLimitPerTenant}`));
                } else {
                    callback();
                }
            }, trigger: 'blur'
        }],
        'featureToggles.allowSelfRegister': [{
            validator: (rule, value, callback) => {
                if (value && !platformForm.advancedControls.allowSelfRegister) {
                    callback(new Error('平台未开放自主注册，租户不可开启'));
                } else {
                    callback();
                }
            }, trigger: 'change'
        }],
        'featureToggles.enableKbEmbed': [{
            validator: (rule, value, callback) => {
                if (value && !platformForm.advancedControls.enableKbEmbed) {
                    callback(new Error('平台未启用外部嵌入，租户不可开启'));
                } else {
                    callback();
                }
            }, trigger: 'change'
        }]
    };
});

async function savePlatformSettings() {
    if (!platformFormRef.value) return;
    try {
        await platformFormRef.value.validate();
        // TODO: 调用后端保存平台级设置
        ElMessage.success('平台设置已保存');
    } catch (error) {
        ElMessage.error('表单校验失败，请检查输入项');
    }
}

function resetPlatformToDefaults() {
    Object.assign(platformForm, JSON.parse(JSON.stringify(platformDefaults)));
    ElMessage.success('已恢复平台默认值');
}

async function saveTenantSettings() {
    if (!tenantFormRef.value) return;
    try {
        await tenantFormRef.value.validate();
        // TODO: 调用后端保存租户级设置
        ElMessage.success('租户设置已保存');
    } catch (error) {
        ElMessage.error('表单校验失败，请检查输入项');
    }
}

function resetTenantToDefaults() {
    Object.assign(tenantForm, JSON.parse(JSON.stringify(tenantDefaults)));
    ElMessage.success('已恢复租户默认值');
}
</script>

<style scoped>
.system-settings {
    padding: 20px;
    background-color: #f5f7fa;
}

.settings-card {
    margin-bottom: 20px;
    background-color: #f5f7fa;
}

.card-header {
    font-weight: 600;
}

.section-card {
    margin-bottom: 16px;
    min-height: 280px;
}

/* 确保组件宽度占满 */
.el-form-item :deep(.el-input-number),
.el-form-item :deep(.el-select),
.el-form-item :deep(.el-radio-group) {
    width: 100%;
}

.inline-inputs {
    display: flex;
    align-items: center;
    gap: 15px;
}

.inline-inputs .spacer {
    width: 12px;
}

.actions {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
    gap: 20px;
}

/* 移动端适配 */

@media (max-width: 768px) {
    .system-settings {
        padding: 8px;
        /* 减少整体内边距以节省空间 */
    }

    .settings-card {
        margin-bottom: 8px;
        /* 减少卡片间距 */
    }

    .card-header {
        font-size: 16px;
        /* 减小标题字体 */
        padding: 8px 0;
        /* 减少标题内边距 */
    }

    .section-card {
        min-height: auto;
        /* 取消最小高度限制 */
        padding: 8px;
        /* 减少卡片内边距 */
        border: 1px solid #e8e8e8;
        /* 轻量化边框 */
        box-shadow: none;
        /* 移除阴影以减少视觉负担 */
    }

    .el-col {
        margin-bottom: 8px;
        /* 减少列间距 */
    }

    /* 表单项标签和内容的垂直排列优化 */
    :deep(.el-form-item__label) {
        float: none !important;
        text-align: left !important;
        font-weight: 400;
        /* 减轻标签字体重量 */
        line-height: 24px;
        /* 增加行高以提高可读性 */
        margin-bottom: 6px;
        /* 增加标签与输入框的间距 */
        padding-bottom: 0 !important;
    }

    :deep(.el-form-item__content) {
        margin-left: 0 !important;
        width: 100%;
        /* 确保输入框占满宽度 */
    }

    /* 确保输入控件占满宽度 */
    :deep(.el-form-item .el-input-number),
    :deep(.el-form-item .el-select),
    :deep(.el-form-item .el-radio-group) {
        width: 100%;
    }

    /* 优化内联输入框组（如 token 有效期最小值和最大值） */
    .inline-inputs {
        flex-direction: column;
        align-items: stretch;
        /* 子元素占满宽度 */
        gap: 12px;
        /* 增加间距以提高可读性 */
        width: 100%;
    }

    .inline-inputs .spacer {
        display: none;
        /* 隐藏分隔符 */
    }

    .inline-inputs .el-input-number {
        width: 100%;
        /* 确保输入框占满宽度 */
    }

    /* 优化按钮布局 */
    .actions {
        flex-direction: column;
        align-items: center;
        /* 按钮居中 */
        gap: 12px;
        /* 增加按钮间距 */
        margin-top: 10px;
    }

    .actions .el-button {
        width: 90%;
        /* 按钮宽度略小于屏幕宽度 */
        max-width: 300px;
        /* 设置最大宽度 */
        font-size: 16px;
        /* 增大字体以提高可点击性 */
        margin-left: 0 !important;
    }

    .actions .el-button[type="primary"] {
        font-weight: 500;
        /* 主要按钮加粗 */
    }

    /* 取消 el-input-number 的加减按钮，转换为纯数字输入框 */
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
        display: none;
        /* 隐藏加减按钮 */
    }

    :deep(.el-input-number) {
        width: 100%;
        /* 确保输入框占满宽度 */
        line-height: 40px;
        /* 增加输入框高度 */
    }

    :deep(.el-input-number .el-input__inner) {
        text-align: left;
        /* 输入内容左对齐 */
        padding: 0 12px;
        /* 增加内边距以便于输入 */
        height: 40px;
        /* 增加输入框高度以提高触控友好性 */
        font-size: 16px;
        /* 增大字体 */
        border-radius: 4px;
        /* 保持圆角 */
    }

    /* 优化单选按钮的交互体验 */
    :deep(.el-radio__inner) {
        width: 20px;
        /* 增大单选按钮的圆点 */
        height: 20px;
    }

    :deep(.el-radio__label) {
        font-size: 16px;
        /* 增大单选按钮标签字体 */
        padding-left: 12px;
        /* 增加标签与圆点的间距 */
    }
}
</style>