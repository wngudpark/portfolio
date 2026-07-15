---
title: 실시간 채팅 애플리케이션
year: "2025"
description: WebSocket을 활용한 실시간 채팅 서비스. 방 생성, 참여, 메시지 브로드캐스트 기능을 구현했습니다.
stack:
  - Node.js
  - Socket.IO
  - Redis
  - React
link: ""
thumbnail: ""
---

## 실시간 채팅

**Socket.IO**로 양방향 통신을 구현하고, Redis Pub/Sub으로 다중 인스턴스 확장을 지원합니다.

- 방(room) 생성 및 참여
- 타이핑 인디케이터
- 메시지 브로드캐스트

```js
io.on('connection', (socket) => {
  socket.on('message', (msg) => io.to(msg.room).emit('message', msg));
});
```
