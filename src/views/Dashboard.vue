<template>
    <div class="dashboard-container">
        <h1>工作台</h1>
        <p>这里是工作台页面内容</p>
    </div>
</template>

<script setup>
// 这里可以添加组件逻辑
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    margin: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 15px;
        margin: 10px;
        border-radius: 8px;
    }
    
    .dashboard-container h1 {
        font-size: 24px;
        margin-bottom: 15px;
    }
    
    .dashboard-container p {
        font-size: 14px;
        line-height: 1.6;
    }
}

@media (max-width: 480px) {
    .dashboard-container {
        padding: 10px;
        margin: 5px;
    }
    
    .dashboard-container h1 {
        font-size: 20px;
    }
}
</style>