// Initializes the SQLite database schema and seeds a few sample projects.
// Run with:  npm run init-db
const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    year          TEXT,
    description   TEXT,
    stack         TEXT,          -- JSON array stored as text, e.g. ["Node.js","SQLite"]
    link          TEXT,
    thumbnail_url TEXT,          -- relative path to uploaded image, e.g. /uploads/xxx.png
    detail_content TEXT,         -- long-form markdown for the detail page
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS careers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT    NOT NULL,
    position    TEXT    NOT NULL,
    start_date  TEXT,               -- e.g. "2022-03"
    end_date    TEXT,               -- NULL means currently employed (재직중)
    description TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migration: add columns to databases created before they existed.
const cols = db.prepare(`PRAGMA table_info(projects)`).all();
const colNames = cols.map((c) => c.name);
if (!colNames.includes('thumbnail_url')) {
  db.exec(`ALTER TABLE projects ADD COLUMN thumbnail_url TEXT`);
  console.log('Migrated: added thumbnail_url column.');
}
if (!colNames.includes('detail_content')) {
  db.exec(`ALTER TABLE projects ADD COLUMN detail_content TEXT`);
  console.log('Migrated: added detail_content column.');
}

// Seed sample data only when the table is empty.
const count = db.prepare('SELECT COUNT(*) AS n FROM projects').get().n;

if (count === 0) {
  const insert = db.prepare(
    `INSERT INTO projects (title, year, description, stack, link, detail_content)
     VALUES (@title, @year, @description, @stack, @link, @detail_content)`
  );

  const samples = [
    {
      title: '개발자 포트폴리오 사이트',
      year: '2026',
      description:
        'Vanilla JS 기반 SPA와 Express + SQLite 백엔드로 만든 포트폴리오. 관리자 로그인 후 프로젝트를 직접 관리할 수 있습니다.',
      stack: JSON.stringify(['HTML', 'Tailwind CSS', 'Vanilla JS', 'Node.js', 'Express', 'SQLite']),
      link: 'https://github.com/',
      detail_content: `## 프로젝트 개요

프레임워크 없이 **Vanilla JS**로 SPA를 구현하고, 백엔드는 Express + SQLite로 구성한 개인 포트폴리오입니다.

### 주요 기능

- 새로고침 없는 섹션 전환 (해시 기반 라우팅)
- 관리자 로그인 후 프로젝트 **추가 / 수정 / 삭제**
- 썸네일 이미지 업로드 (multer)
- 마크다운으로 작성하는 상세 페이지

### 기술적 포인트

1. 세션 기반 인증과 \`bcrypt\` 비밀번호 해시
2. 서버 측 인증 미들웨어로 쓰기 API 보호
3. Tailwind CSS 로컬 빌드 파이프라인

> "복잡한 프레임워크 없이도 충분히 깔끔한 SPA를 만들 수 있다."

관련 코드는 아래처럼 구성했습니다.

\`\`\`js
router.get('/api/projects/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});
\`\`\`

[GitHub 저장소 보기](https://github.com/)`
    },
    {
      title: '실시간 채팅 애플리케이션',
      year: '2025',
      description:
        'WebSocket을 활용한 실시간 채팅 서비스. 방 생성, 참여, 메시지 브로드캐스트 기능을 구현했습니다.',
      stack: JSON.stringify(['Node.js', 'Socket.IO', 'Redis', 'React']),
      link: '',
      detail_content: `## 실시간 채팅

**Socket.IO**로 양방향 통신을 구현하고, Redis Pub/Sub으로 다중 인스턴스 확장을 지원합니다.

- 방(room) 생성 및 참여
- 타이핑 인디케이터
- 메시지 브로드캐스트

\`\`\`js
io.on('connection', (socket) => {
  socket.on('message', (msg) => io.to(msg.room).emit('message', msg));
});
\`\`\``
    },
    {
      title: 'REST API 백엔드 템플릿',
      year: '2024',
      description:
        'JWT 인증, 역할 기반 접근 제어, 자동 문서화를 포함한 재사용 가능한 백엔드 스타터 템플릿.',
      stack: JSON.stringify(['Express', 'PostgreSQL', 'JWT', 'Swagger']),
      link: '',
      detail_content: `## REST API 스타터

새 프로젝트를 빠르게 시작할 수 있는 백엔드 템플릿입니다.

### 포함 기능

- JWT 인증 & 리프레시 토큰
- 역할 기반 접근 제어(RBAC)
- Swagger 자동 문서화`
    }
  ];

  const seed = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  seed(samples);

  console.log(`Seeded ${samples.length} sample projects.`);
}

// Seed sample careers only when the table is empty.
const careerCount = db.prepare('SELECT COUNT(*) AS n FROM careers').get().n;

if (careerCount === 0) {
  const insertCareer = db.prepare(
    `INSERT INTO careers (company, position, start_date, end_date, description)
     VALUES (@company, @position, @start_date, @end_date, @description)`
  );

  const careers = [
    {
      company: '브라이트벨',
      position: 'Backend Developer',
      start_date: '2024-01',
      end_date: null, // 재직중
      description:
        '사내 서비스 백엔드 API 설계 및 개발, 데이터베이스 스키마 관리, 배포 자동화를 담당하고 있습니다.'
    },
    {
      company: '스타트업 A',
      position: 'Full-stack Developer',
      start_date: '2022-03',
      end_date: '2023-12',
      description:
        'Node.js/React 기반 웹 서비스 전반을 개발했습니다. 결제 연동, 관리자 도구, 실시간 알림 기능을 구현했습니다.'
    },
    {
      company: '웹 에이전시 B',
      position: 'Junior Developer',
      start_date: '2021-01',
      end_date: '2022-02',
      description:
        '다양한 클라이언트 웹사이트를 제작하며 프론트엔드와 간단한 백엔드 개발 경험을 쌓았습니다.'
    }
  ];

  const seedCareers = db.transaction((rows) => {
    for (const row of rows) insertCareer.run(row);
  });
  seedCareers(careers);

  console.log(`Seeded ${careers.length} sample careers.`);
}

console.log('Database initialized at:', require('path').join(__dirname, 'portfolio.db'));
