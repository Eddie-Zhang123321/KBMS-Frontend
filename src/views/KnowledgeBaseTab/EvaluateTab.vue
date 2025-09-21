<template>
    <div class="evaluate-tab">
        <div class="left-panel">
            <div class="header">
                <el-input v-model="searchQuery" placeholder="搜索评测集" clearable size="small">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button type="primary" size="small" icon="Plus" @click="showAddDialog = true">
                    添加评测集
                </el-button>
            </div>

            <el-table :data="filteredEvalSets" border highlight-current-row @row-click="handleSelectSet"
                class="eval-table">
                <el-table-column prop="name" label="评测集名称" />
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="questionCount" label="问题数" width="100" align="center" />
                <el-table-column label="操作" width="100" align="center">
                    <template #default="scope">
                        <el-button type="danger" size="small" text @click.stop="handleDeleteSet(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="right-panel">
            <template v-if="showDetail && currentSet">
                <div class="detail-header">
                    <el-button link @click="showDetail = false">⬅ 返回</el-button>
                    <h3>{{ currentSet.name }} - 详情</h3>
                </div>

                <el-descriptions :column="2" border class="mb-4">
                    <el-descriptions-item label="名称">{{ currentSet.name }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ currentSet.date }}</el-descriptions-item>
                    <el-descriptions-item label="问题数">{{ currentSet.questionCount }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ currentSet.status }}</el-descriptions-item>
                </el-descriptions>

                <h4 class="section-title">期望问答</h4>
                <el-table :data="qaList" border style="width: 100%" v-loading="qaLoading">
                    <el-table-column prop="question" label="问题" min-width="180" />
                    <el-table-column prop="expected_answer" label="期望回答" min-width="180" />
                    <el-table-column label="操作" width="100" align="center">
                        <template #default="scope">
                            <el-button type="danger" size="small" text @click="handleDeleteQA(scope.row)">
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </template>

            <template v-else>
                <h3 class="section-title">评估结果</h3>
                <div v-if="currentSet">
                    <p>当前评测集：{{ currentSet.name }}</p>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="评测日期">
                            {{ currentSet.metrics?.evaluation_date || "暂无" }}
                        </el-descriptions-item>
                        <el-descriptions-item label="问题数">
                            {{ currentSet.metrics?.total_questions ?? currentSet.questionCount ?? 0 }}
                        </el-descriptions-item>
                        <el-descriptions-item label="准确率">
                            {{ currentSet.metrics?.accuracy ?? 0 }}%
                        </el-descriptions-item>
                        <el-descriptions-item label="召回率">
                            {{ currentSet.metrics?.recall ?? 0 }}%
                        </el-descriptions-item>
                        <el-descriptions-item label="响应时间">
                            {{ currentSet.metrics?.response_time ?? 0 }} ms
                        </el-descriptions-item>
                        <el-descriptions-item label="合理性得分">
                            {{ currentSet.metrics?.reasonableness ?? 0 }}%
                        </el-descriptions-item>
                        <el-descriptions-item label="覆盖率">
                            {{ currentSet.metrics?.coverage ?? 0 }}%
                        </el-descriptions-item>
                        <el-descriptions-item label="成功率">
                            {{ currentSet.metrics?.success_rate ?? 0 }}%
                        </el-descriptions-item>
                        <el-descriptions-item label="总体得分">
                            {{ currentSet.metrics?.overall_score ?? 0 }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="warning" v-if="(currentSet.metrics?.coverage ?? 0) < 90">
                        ⚠️ 覆盖率低于 90%，请检查未覆盖的问题
                    </div>
                </div>
                <div v-else class="empty">
                    请选择左侧的评测集以查看评估结果
                </div>

                <div class="footer">
                    <el-button type="primary" :loading="running" @click="handleRunEval">
                        运行评估
                    </el-button>
                    <el-button type="success" @click="handleViewDetail" v-if="currentSet">
                        查看详情
                    </el-button>
                </div>
            </template>
        </div>

        <el-dialog title="添加评测集" v-model="showAddDialog" width="500px">
            <el-form :model="newEvalSet" label-width="100px">
                <el-form-item label="名称" required>
                    <el-input v-model="newEvalSet.name" placeholder="请输入名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="newEvalSet.description" placeholder="请输入描述" />
                </el-form-item>
                <el-form-item label="上传文件" required>
                    <el-upload drag :auto-upload="false" :limit="1" accept=".json" :on-change="handleFileChange">
                        <i class="el-icon-upload"></i>
                        <div class="el-upload__text">
                            将文件拖到此处，或 <em>点击上传</em>
                        </div>
                    </el-upload>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="submitEvalSet">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
import {
    getEvalSets,
    getEvalSetDetail,
    createEvalSet,
    deleteEvalSet,
    runEvaluation,
    getEvalQuestions,
    deleteEvalQuestion,
} from "@/api/Knowledgebase";

const route = useRoute();

const searchQuery = ref("");
const currentSet = ref(null);
const evalSets = ref([]);
const running = ref(false);

const showAddDialog = ref(false);
const newEvalSet = ref({ name: "", description: "", file: null });

const showDetail = ref(false);
const qaList = ref([]);
const qaLoading = ref(false);

// Filter search results
const filteredEvalSets = computed(() =>
    evalSets.value.filter((set) => set.name.includes(searchQuery.value.trim()))
);

// Load evaluation set list
const loadEvalSets = async () => {
    try {
        const res = await getEvalSets({
            knowledge_base_id: parseInt(route.params.id),
            page: 1,
            size: 10,
        });
        evalSets.value = (res.datasets || []).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            date: item.created_at,
            questionCount: item.total_questions,
            status: item.status,
        }));
    } catch (e) {
        console.error(e);
        ElMessage.error("加载评测集失败");
    }
};

// Select an evaluation set
const handleSelectSet = async (row) => {
    try {
        const res = await getEvalSetDetail(row.id);
        currentSet.value = { ...row, metrics: res.metrics || {} };
    } catch (e) {
        console.error(e);
        ElMessage.error("获取评测集详情失败");
    }
};

// Delete an evaluation set
const handleDeleteSet = async (row) => {
    try {
        await ElMessageBox.confirm(`确定要删除评测集「${row.name}」吗？`, "提示", {
            type: "warning",
        });
        await deleteEvalSet(row.id);
        ElMessage.success("删除成功");
        if (currentSet.value?.id === row.id) currentSet.value = null;
        await loadEvalSets();
    } catch (e) {
        if (e !== "cancel") {
            console.error(e);
            ElMessage.error("删除失败");
        }
    }
};

// File selection
const handleFileChange = (file) => {
    newEvalSet.value.file = file.raw;
};

// Submit a new evaluation set
const submitEvalSet = async () => {
    if (!newEvalSet.value.name || !newEvalSet.value.file) {
        return ElMessage.warning("请填写名称并上传文件");
    }
    try {
        const formData = new FormData();
        formData.append("name", newEvalSet.value.name);
        formData.append("knowledge_base_id", parseInt(route.params.id));
        if (newEvalSet.value.description)
            formData.append("description", newEvalSet.value.description);
        formData.append("file", newEvalSet.value.file);

        await createEvalSet(formData);
        ElMessage.success("评测集创建成功");
        showAddDialog.value = false;
        newEvalSet.value = { name: "", description: "", file: null };
        await loadEvalSets();
    } catch (e) {
        console.error(e);
        ElMessage.error("创建失败");
    }
};

// Run evaluation
const handleRunEval = async () => {
    if (!currentSet.value) return;
    running.value = true;
    try {
        const res = await runEvaluation(currentSet.value.id);
        currentSet.value.metrics = res || {};
        ElMessage.success("评测完成");
    } catch (e) {
        console.error(e);
        ElMessage.error("评测失败");
    } finally {
        running.value = false;
    }
};

// View details
const handleViewDetail = async () => {
    if (!currentSet.value) return;
    showDetail.value = true;
    qaLoading.value = true;
    try {
        // Correct API call
        const res = await getEvalQuestions(currentSet.value.id);
        qaList.value = res.questions || []; // 修改为res.data.questions
    } catch (e) {
        console.error(e);
        ElMessage.error("加载问答失败");
    } finally {
        qaLoading.value = false;
    }
};

// Delete QA pair
const handleDeleteQA = async (qa) => {
    try {
        await ElMessageBox.confirm(`确定要删除该问答吗？`, "提示", { type: "warning" });
        // Correct API call, passing both dataset_id and question_id
        await deleteEvalQuestion(currentSet.value.id, qa.id);
        ElMessage.success("删除成功");
        qaList.value = qaList.value.filter((item) => item.id !== qa.id);
    } catch (e) {
        if (e !== "cancel") {
            console.error(e);
            ElMessage.error("删除失败");
        }
    }
};

onMounted(() => loadEvalSets());
</script>

<style scoped>
.evaluate-tab {
    display: flex;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
}

.left-panel {
    width: 40%;
    padding-right: 20px;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
}

.right-panel {
    flex: 1;
    padding-left: 20px;
}

.header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.header .el-input {
    flex: 1;
    margin-right: 10px;
}

.eval-table {
    flex: 1;
}

.section-title {
    font-weight: bold;
    margin-bottom: 15px;
}

.footer {
    margin-top: 20px;
    display: flex;
    gap: 10px;
}

.warning {
    margin-top: 10px;
    color: #e74c3c;
}

.empty {
    color: #999;
    font-style: italic;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.mb-4 {
    margin-bottom: 16px;
}
</style>