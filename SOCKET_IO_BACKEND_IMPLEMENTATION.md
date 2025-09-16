# Socket.IO 后端实现指南

## 1. 系统架构概述

本文档提供了 Socket.IO 通知系统的后端实现详细指南，旨在实现前端 WebSocket 通知需求。

## 2. 技术栈建议

- 语言：Java/Spring Boot 或 Node.js/Express
- WebSocket：Socket.IO
- 认证：JWT
- 缓存：Redis（可选）

## 3. 连接认证与鉴权

### 3.1 连接元数据结构

```typescript
interface ConnectionMetadata {
  token: string      // 用户认证 Token
  userId: string     // 用户唯一标识
  role: UserRole     // 用户角色
  tenantId?: string  // 租户 ID（可选）
}
```

### 3.2 用户角色枚举

```typescript
enum UserRoles {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',       // 平台管理员
  TENANT_SUPER_ADMIN = 'TENANT_SUPER_ADMIN', // 租户超级管理员
  TENANT_USER = 'TENANT_USER'               // 租户普通用户
}
```

### 3.3 Token 验证示例（Java）

```java
@OnConnect
public void onConnect(Socket socket) {
    Map<String, Object> handshakeData = socket.getHandshakeData();
    String token = (String) handshakeData.get("token");
    
    // 验证 Token
    if (!jwtTokenProvider.validateToken(token)) {
        socket.disconnect(true);
        return;
    }

    // 解析用户信息
    UserDetails userDetails = jwtTokenProvider.getUserDetailsFromToken(token);
    
    // 加入对应房间
    joinUserRooms(socket, userDetails);
}

private void joinUserRooms(Socket socket, UserDetails userDetails) {
    switch (userDetails.getRole()) {
        case PLATFORM_ADMIN:
            socket.joinRoom("PLATFORM_ADMIN_ROOM");
            break;
        case TENANT_SUPER_ADMIN:
            socket.joinRoom("TENANT_" + userDetails.getTenantId() + "_ADMIN_ROOM");
            break;
    }
}
```

## 4. 通知类型定义

```typescript
enum NotificationTypes {
  // 租户相关通知
  TENANT_REGISTRATION_PENDING = 'tenant:registration:pending'
  TENANT_REGISTRATION_APPROVED = 'tenant:registration:approved'
  TENANT_REGISTRATION_REJECTED = 'tenant:registration:rejected'

  // 用户注册相关通知
  USER_REGISTER_PENDING = 'user:register:pending'
  USER_REGISTER_APPROVED = 'user:register:approved'
  USER_REGISTER_REJECTED = 'user:register:rejected'

  // 系统通知
  SYSTEM_ALERT = 'system:alert'
  SYSTEM_WARNING = 'system:warning'
  SYSTEM_INFO = 'system:info'
}
```

## 5. 通知发送实现

### 5.1 租户注册通知

```java
@Service
public class NotificationService {
    private final SocketIOServer socketServer;

    public void notifyTenantRegistration(TenantRegistrationDTO tenantData) {
        // 广播到平台管理员房间
        socketServer.getRoomOperations("PLATFORM_ADMIN_ROOM")
            .sendEvent(
                NotificationTypes.TENANT_REGISTRATION_PENDING, 
                new TenantNotificationPayload(
                    tenantData.getName(),
                    tenantData.getId(),
                    System.currentTimeMillis()
                )
            );
    }
}
```

### 5.2 用户注册通知

```java
@Service
public class NotificationService {
    private final SocketIOServer socketServer;

    public void notifyUserRegistration(UserRegistrationDTO userData) {
        // 广播到特定租户管理员房间
        socketServer.getRoomOperations("TENANT_" + userData.getTenantId() + "_ADMIN_ROOM")
            .sendEvent(
                NotificationTypes.USER_REGISTER_PENDING, 
                new UserNotificationPayload(
                    userData.getUsername(),
                    userData.getId(),
                    userData.getTenantId(),
                    System.currentTimeMillis()
                )
            );
    }
}
```

## 6. 安全性考虑

### 6.1 Token 验证
- 使用 JWT 进行安全认证
- 验证 Token 的有效性和过期时间
- 检查用户角色权限

### 6.2 防护措施
- 实现速率限制
- 防止恶意广播
- 限制房间订阅权限

## 7. 性能优化

### 7.1 连接管理
- 使用连接池
- 实现心跳机制
- 管理长连接生命周期

### 7.2 通知持久化
- 使用消息队列（RabbitMQ/Kafka）
- 实现通知的幂等性
- 考虑通知历史记录存储

## 8. 错误处理策略

### 8.1 连接错误
- 记录详细的连接错误日志
- 实现自动重连机制
- 提供友好的错误提示

### 8.2 通知发送失败
- 实现重试机制
- 记录发送失败的通知
- 提供补偿机制

## 9. 配置建议

```yaml
socket-io:
  port: 8081
  cors:
    allowed-origins: 
      - http://localhost:3000
      - https://your-frontend-domain.com
  
  authentication:
    jwt:
      secret-key: your-secret-key
      expiration: 3600000  # 1 hour
```

## 10. 前后端协作清单

### 10.1 前端期望
- 实时通知推送
- 安全的 Token 验证
- 精确的角色权限控制

### 10.2 后端实现
- 完整的 Socket.IO 服务
- 安全的认证机制
- 灵活的通知路由

## 11. 测试建议

- 单元测试 Socket.IO 服务
- 集成测试通知发送流程
- 模拟不同角色场景
- 压力测试长连接性能

## 12. 监控与日志

- 记录 Socket.IO 连接日志
- 监控在线用户数
- 跟踪通知发送成功率
- 性能指标收集

## 结语

本文档提供了 Socket.IO 通知系统的comprehensive实现指南。根据具体业务场景和技术栈，可能需要进行适当调整。
