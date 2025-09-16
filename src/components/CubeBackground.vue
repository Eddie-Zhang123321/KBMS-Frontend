<template>
  <div class="cube-background">
    <div class="cube-container">
      <div
        v-for="(cube, index) in cubes"
        :key="index"
        class="cube"
        :style="{
          left: cube.x + 'px',
          top: cube.y + 'px',
          transform: `rotateX(${cube.rotateX}deg) rotateY(${cube.rotateY}deg) rotateZ(${cube.rotateZ}deg)`,
          width: cube.size + 'px',
          height: cube.size + 'px'
        }"
      >
        <div class="cube-face front"></div>
        <div class="cube-face back"></div>
        <div class="cube-face right"></div>
        <div class="cube-face left"></div>
        <div class="cube-face top"></div>
        <div class="cube-face bottom"></div>
      </div>
    </div>
    <!-- 调试信息 -->
    <!-- <div class="debug-info" v-if="showDebug">
      <p>立方体数量: {{ cubes.length }}</p>
      <p>窗口大小: {{ windowWidth }}x{{ windowHeight }}</p>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const cubes = ref([])
const showDebug = ref(true) // 临时启用调试信息
const windowWidth = ref(0)
const windowHeight = ref(0)
let animationId = null

// 创建立方体数据
const createCubes = () => {
  const cubeData = []

  // 创建大立方体
  for (let i = 0; i < 5; i++) {
    cubeData.push({
      x: Math.random() * (window.innerWidth || 1200),
      y: (window.innerHeight || 800) * 0.33 + (Math.random() - 0.5) * 100,
      size: 40 + Math.random() * 20,
      rotateX: Math.random() * 360,
      rotateY: Math.random() * 360,
      rotateZ: Math.random() * 360,
      speedX: 0.5 + Math.random() * 1,
      speedY: (Math.random() - 0.5) * 0.5,
      speedRotateX: (Math.random() - 0.5) * 2,
      speedRotateY: (Math.random() - 0.5) * 2,
      speedRotateZ: (Math.random() - 0.5) * 2,
      type: 'large'
    })
  }

  // 创建小立方体
  for (let i = 0; i < 8; i++) {
    cubeData.push({
      x: Math.random() * (window.innerWidth || 1200),
      y: (window.innerHeight || 800) * 0.33 + (Math.random() - 0.5) * 150,
      size: 15 + Math.random() * 10,
      rotateX: Math.random() * 360,
      rotateY: Math.random() * 360,
      rotateZ: Math.random() * 360,
      speedX: 0.3 + Math.random() * 0.7,
      speedY: (Math.random() - 0.5) * 0.3,
      speedRotateX: (Math.random() - 0.5) * 3,
      speedRotateY: (Math.random() - 0.5) * 3,
      speedRotateZ: (Math.random() - 0.5) * 3,
      type: 'small'
    })
  }

  cubes.value = cubeData
  console.log('创建立方体:', cubeData.length, '个')
}

// 动画循环
const animate = () => {
  cubes.value.forEach(cube => {
    // 移动立方体
    cube.x += cube.speedX
    cube.y += cube.speedY

    // 旋转立方体
    cube.rotateX += cube.speedRotateX
    cube.rotateY += cube.speedRotateY
    cube.rotateZ += cube.speedRotateZ

    // 重置位置（从右侧重新进入）
    const screenWidth = window.innerWidth || 1200
    const screenHeight = window.innerHeight || 800
    if (cube.x > screenWidth + 100) {
      cube.x = -100
      cube.y = screenHeight * 0.33 + (Math.random() - 0.5) * 100
    }

    // 限制垂直移动范围
    if (cube.y < screenHeight * 0.2) {
      cube.y = screenHeight * 0.2
      cube.speedY = Math.abs(cube.speedY)
    } else if (cube.y > screenHeight * 0.5) {
      cube.y = screenHeight * 0.5
      cube.speedY = -Math.abs(cube.speedY)
    }
  })

  animationId = requestAnimationFrame(animate)
}

// 窗口大小改变时重新创建立方体
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  createCubes()
}

onMounted(() => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  createCubes()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.cube-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #e8f0fe 0%, #5faaff 100%);
  overflow: hidden;
  z-index: 0;
}

.cube-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.cube {
  position: absolute;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}

.cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: transparent;
  box-sizing: border-box;
}

.cube-face.front {
  transform: translateZ(50%);
}

.cube-face.back {
  transform: translateZ(-50%) rotateY(180deg);
}

.cube-face.right {
  transform: rotateY(90deg) translateZ(50%);
}

.cube-face.left {
  transform: rotateY(-90deg) translateZ(50%);
}

.cube-face.top {
  transform: rotateX(90deg) translateZ(50%);
}

.cube-face.bottom {
  transform: rotateX(-90deg) translateZ(50%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cube-face {
    border-width: 1px;
  }
}

/* .debug-info {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 1000;
} */
</style>
