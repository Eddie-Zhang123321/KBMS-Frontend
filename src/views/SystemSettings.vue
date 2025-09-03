<template>
    <div class="system-settings">
        <!-- 平台管理员设置（仅平台管理员可见） -->
        <el-card v-if="canSeePlatform" class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>平台管理员设置（全局规则 + 上限阈值）</span>
                </div>
            </template>

            <el-row :gutter="16">
                <!-- 安全与认证 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>安全与认证</span></template>
                        <el-form :model="platformForm.securityAuth" label-width="160px">
                            <el-form-item label="token有效范围（分钟）">
                                <div class="inline-inputs">
                                    <span>最小值：</span>
                                    <el-input-number v-model="platformForm.securityAuth.tokenMin" :min="1" :max="100000" />
                                    <span class="spacer" />
                                    <span>最大值：</span>
                                    <el-input-number v-model="platformForm.securityAuth.tokenMax" :min="platformForm.securityAuth.tokenMin" :max="200000" />
                                </div>
                            </el-form-item>
                            <el-form-item label="最大登录失败次数上限">
                                <el-input-number v-model="platformForm.securityAuth.maxLoginFailures" :min="1" :max="100" />
                            </el-form-item>
                            <el-form-item label="密码强度最低要求">
                                <el-select v-model="platformForm.securityAuth.passwordStrength" placeholder="请选择">
                                    <el-option label="低" value="low" />
                                    <el-option label="中" value="medium" />
                                    <el-option label="高" value="high" />
                                </el-select>
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 系统行为 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>系统行为</span></template>
                        <el-form :model="platformForm.systemBehavior" label-width="180px">
                            <el-form-item label="上传文件大小上限（MB）">
                                <el-input-number v-model="platformForm.systemBehavior.maxUploadSizeMB" :min="1" :max="102400" />
                            </el-form-item>
                            <el-form-item label="是否允许批量上传">
                                <el-radio-group v-model="platformForm.systemBehavior.allowBatchUpload">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="日志保留天数上限">
                                <el-input-number v-model="platformForm.systemBehavior.logRetentionDaysMax" :min="1" :max="3650" />
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 租户配额 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>租户配额</span></template>
                        <el-form :model="platformForm.tenantQuota" label-width="220px">
                            <el-form-item label="单租户最大知识库数上限">
                                <el-input-number v-model="platformForm.tenantQuota.kbLimitPerTenant" :min="1" :max="100000" />
                            </el-form-item>
                            <el-form-item label="单租户最大用户数上限">
                                <el-input-number v-model="platformForm.tenantQuota.userLimitPerTenant" :min="1" :max="1000000" />
                            </el-form-item>
                            <el-form-item label="单租户最大存储容量上限（GB）">
                                <el-input-number v-model="platformForm.tenantQuota.storageLimitPerTenantGB" :min="1" :max="1048576" />
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 高级功能控制 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>高级功能控制</span></template>
                        <el-form :model="platformForm.advancedControls" label-width="220px">
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
                        </el-form>
                    </el-card>
                </el-col>
            </el-row>

            <div class="actions">
                <el-button @click="resetPlatformToDefaults">恢复默认值</el-button>
                <el-button type="primary" @click="savePlatformSettings">保存设置</el-button>
            </div>
        </el-card>

        <!-- 租户超级管理员设置（仅当前租户超级管理员可见） -->
        <el-card v-if="canSeeTenant" class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>此租户超级管理员设置（在平台范围内细化）</span>
                </div>
            </template>

            <el-row :gutter="16">
                <!-- 安全与认证 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>安全与认证</span></template>
                        <el-form :model="tenantForm.securityAuth" label-width="180px">
                            <el-form-item label="token有效期（分钟）">
                                <el-input-number v-model="tenantForm.securityAuth.tokenMinutes" :min="1" :max="200000" />
                            </el-form-item>
                            <el-form-item label="最大登录失败次数">
                                <el-input-number v-model="tenantForm.securityAuth.maxLoginFailures" :min="1" :max="100" />
                            </el-form-item>
                            <el-form-item label="密码强度最低">
                                <el-select v-model="tenantForm.securityAuth.passwordStrength" placeholder="请选择">
                                    <el-option label="低" value="low" />
                                    <el-option label="中" value="medium" />
                                    <el-option label="高" value="high" />
                                </el-select>
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 系统行为 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>系统行为</span></template>
                        <el-form :model="tenantForm.systemBehavior" label-width="220px">
                            <el-form-item label="单个文件上传大小上限（MB）">
                                <el-input-number v-model="tenantForm.systemBehavior.singleFileMaxUploadMB" :min="1" :max="102400" />
            </el-form-item>
            <el-form-item label="日志保留天数">
                                <el-input-number v-model="tenantForm.systemBehavior.logRetentionDays" :min="1" :max="3650" />
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 租户配额 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>租户配额</span></template>
                        <el-form :model="tenantForm.tenantQuota" label-width="200px">
                            <el-form-item label="知识库数量限制">
                                <el-input-number v-model="tenantForm.tenantQuota.kbLimit" :min="1" :max="100000" />
                            </el-form-item>
                            <el-form-item label="用户数量限制">
                                <el-input-number v-model="tenantForm.tenantQuota.userLimit" :min="1" :max="1000000" />
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>

                <!-- 功能开关 -->
                <el-col :span="12">
                    <el-card class="section-card" shadow="never">
                        <template #header><span>功能开关</span></template>
                        <el-form :model="tenantForm.featureToggles" label-width="240px">
                            <el-form-item label="是否允许自主注册">
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
                            <el-form-item label="是否启用知识库外部嵌入">
                                <el-radio-group v-model="tenantForm.featureToggles.enableKbEmbed">
                                    <el-radio :value="true">开启</el-radio>
                                    <el-radio :value="false">关闭</el-radio>
                                </el-radio-group>
            </el-form-item>
        </el-form>
                    </el-card>
                </el-col>
            </el-row>

            <div class="actions">
                <el-button @click="resetTenantToDefaults">恢复默认值</el-button>
                <el-button type="primary" @click="saveTenantSettings">保存设置</el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { ROLES } from '@/constants/roles'

const userStore = useUserStore()

const canSeePlatform = computed(() => userStore.roles?.includes(ROLES.PLATFORM_ADMIN))
const canSeeTenant = computed(() => userStore.roles?.includes(ROLES.SUPER_ADMIN))

// 平台默认值
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

// 租户默认值（需要在平台范围内）
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

function validateTenantWithinPlatform() {
    const p = platformForm
    const t = tenantForm
    const errors = []

    // token minutes within [min, max]
    if (t.securityAuth.tokenMinutes < p.securityAuth.tokenMin || t.securityAuth.tokenMinutes > p.securityAuth.tokenMax) {
        errors.push('租户 token 有效期需在平台设置范围内')
    }
    // max login failures <= platform
    if (t.securityAuth.maxLoginFailures > p.securityAuth.maxLoginFailures) {
        errors.push('租户最大登录失败次数不得超过平台上限')
    }
    // password strength >= platform minimum
    if (strengthOrder[t.securityAuth.passwordStrength] < strengthOrder[p.securityAuth.passwordStrength]) {
        errors.push('租户密码强度不得低于平台最低要求')
    }
    // upload size <= platform
    if (t.systemBehavior.singleFileMaxUploadMB > p.systemBehavior.maxUploadSizeMB) {
        errors.push('租户单文件上传大小上限不得超过平台上限')
    }
    // log retention days <= platform
    if (t.systemBehavior.logRetentionDays > p.systemBehavior.logRetentionDaysMax) {
        errors.push('租户日志保留天数不得超过平台上限')
    }
    // quotas <= platform
    if (t.tenantQuota.kbLimit > p.tenantQuota.kbLimitPerTenant) {
        errors.push('租户知识库数量限制不得超过平台上限')
    }
    if (t.tenantQuota.userLimit > p.tenantQuota.userLimitPerTenant) {
        errors.push('租户用户数量限制不得超过平台上限')
    }
    // feature toggles must not enable if platform disabled
    if (t.featureToggles.allowSelfRegister && !p.advancedControls.allowSelfRegister) {
        errors.push('平台未开放自主注册，租户不可开启')
    }
    if (t.featureToggles.enableKbEmbed && !p.advancedControls.enableKbEmbed) {
        errors.push('平台未启用外部嵌入，租户不可开启')
    }

    return errors
}

function savePlatformSettings() {
    // TODO: 调用后端保存平台级设置
    ElMessage.success('平台设置已保存')
}

function resetPlatformToDefaults() {
    Object.assign(platformForm.securityAuth, platformDefaults.securityAuth)
    Object.assign(platformForm.systemBehavior, platformDefaults.systemBehavior)
    Object.assign(platformForm.tenantQuota, platformDefaults.tenantQuota)
    Object.assign(platformForm.advancedControls, platformDefaults.advancedControls)
    ElMessage.success('已恢复平台默认值')
}

function saveTenantSettings() {
    const errors = validateTenantWithinPlatform()
    if (errors.length) {
        ElMessage.error(errors.join('；'))
        return
    }
    // TODO: 调用后端保存租户级设置
    ElMessage.success('租户设置已保存')
}

function resetTenantToDefaults() {
    Object.assign(tenantForm.securityAuth, tenantDefaults.securityAuth)
    Object.assign(tenantForm.systemBehavior, tenantDefaults.systemBehavior)
    Object.assign(tenantForm.tenantQuota, tenantDefaults.tenantQuota)
    Object.assign(tenantForm.featureToggles, tenantDefaults.featureToggles)
    ElMessage.success('已恢复租户默认值')
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
    background-color: #f5f7fa;
}

.section-card {
    margin-bottom: 16px;
    height: 300px;
}

.inline-inputs {
    display: flex;
    align-items: center;
    gap: 15px;
}
.inline-inputs .spacer { width: 12px; }

.actions {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
    gap: 20px;
}
</style>