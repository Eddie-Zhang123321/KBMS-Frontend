<template>
    <div class="evaluate-tab">
        <!-- 左侧评测列表 -->
        <div class="left-panel">
            <div class="header">
                <el-input v-model="searchQuery" placeholder="搜索评测集" clearable size="small">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button type="primary" size="small" icon="Plus" @click="handleAddSet">
                    添加评测集
                </el-button>
            </div>

            <el-table :data="filteredEvalSets" border highlight-current-row @row-click="handleSelectSet"
                class="eval-table">
                <el-table-column prop="name" label="评测集名称" />
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="questionCount" label="问题数" width="100" align="center" />
            </el-table>
        </div>

        <!-- 右侧评估结果 -->
        <div class="right-panel">
            <h3 class="section-title">评估结果</h3>

            <div v-if="currentSet">
                <p>当前评测集：{{ currentSet.name }} - {{ currentSet.date }}</p>
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="准确率">
                        {{ currentSet.metrics.accuracy }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="召回率">
                        {{ currentSet.metrics.recall }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="响应时间">
                        {{ currentSet.metrics.latency }} s
                    </el-descriptions-item>
                    <el-descriptions-item label="合理性得分">
                        {{ currentSet.metrics.reasonableness }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="覆盖率">
                        {{ currentSet.metrics.coverage }}%
                    </el-descriptions-item>
                </el-descriptions>

                <div class="warning" v-if="currentSet.metrics.coverage < 90">
                    ⚠️ 覆盖率低于 90%，请检查未覆盖的问题
                </div>
            </div>
            <div v-else class="empty">
                请选择左侧的评测集以查看评估结果
            </div>

            <div class="footer">
                <el-button type="primary" @click="handleRunEval">运行评估</el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Search, Plus } from "@element-plus/icons-vue";

const searchQuery = ref("");
const currentSet = ref(null);

const evalSets = ref([
    {
        name: "电机维护测试",
        date: "2025-07-22",
        questionCount: 10,
        metrics: {
            accuracy: 95,
            recall: 92,
            latency: 1.5,
            reasonableness: 90,
            coverage: 85,
        },
    },
    {
        name: "法通总知识测试",
        date: "2025-07-21",
        questionCount: 15,
        metrics: {
            accuracy: 90,
            recall: 88,
            latency: 2.0,
            reasonableness: 85,
            coverage: 92,
        },
    },
]);

const filteredEvalSets = computed(() =>
    evalSets.value.filter((set) =>
        set.name.includes(searchQuery.value.trim())
    )
);

const handleSelectSet = (row) => {
    currentSet.value = row;
};

const handleAddSet = () => {
    console.log("添加评测集");
};

const handleRunEval = () => {
    if (!currentSet.value) {
        return ElMessage.warning("请先选择评测集");
    }
    console.log("运行评估:", currentSet.value.name);
};
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
}

.warning {
    margin-top: 10px;
    color: #e74c3c;
}

.empty {
    color: #999;
    font-style: italic;
}
</style>
