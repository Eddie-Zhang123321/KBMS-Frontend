// 响应式工具函数
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
}

// 检测是否为移动端
export const isMobile = () => {
  return window.innerWidth <= breakpoints.mobile
}

// 检测是否为平板端
export const isTablet = () => {
  return window.innerWidth > breakpoints.mobile && window.innerWidth <= breakpoints.tablet
}

// 检测是否为桌面端
export const isDesktop = () => {
  return window.innerWidth > breakpoints.tablet
}

// 获取对话框宽度
export const getDialogWidth = (defaultWidth = '500px') => {
  return isMobile() ? '95%' : defaultWidth
}

// 获取对话框是否全屏
export const isDialogFullscreen = () => {
  return isMobile()
}

// 智能侧边栏状态管理
export const useSmartSidebar = () => {
  const isMobileRef = ref(isMobile())
  const sidebarCollapsed = ref(isMobile())

  const updateSidebarState = () => {
    const wasMobile = isMobileRef.value
    isMobileRef.value = isMobile()

    // 如果从移动端切换到桌面端，自动显示侧边栏
    if (wasMobile && !isMobileRef.value) {
      sidebarCollapsed.value = false
    }
    // 如果切换到移动端，自动隐藏侧边栏
    else if (!wasMobile && isMobileRef.value) {
      sidebarCollapsed.value = true
    }
  }

  onMounted(() => {
    window.addEventListener('resize', updateSidebarState)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSidebarState)
  })

  return {
    isMobile: isMobileRef,
    sidebarCollapsed,
    toggleSidebar: () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
  }
}

// 响应式监听器
export const useResponsive = () => {
  const isMobileRef = ref(isMobile())
  const isTabletRef = ref(isTablet())
  const isDesktopRef = ref(isDesktop())

  const updateResponsive = () => {
    isMobileRef.value = isMobile()
    isTabletRef.value = isTablet()
    isDesktopRef.value = isDesktop()
  }

  onMounted(() => {
    window.addEventListener('resize', updateResponsive)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsive)
  })

  return {
    isMobile: isMobileRef,
    isTablet: isTabletRef,
    isDesktop: isDesktopRef
  }
}
