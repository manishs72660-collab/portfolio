// ====== Poora portfolio content yahi se aata hai. Yahi edit karo. ======
export const PROFILE = {
  name: 'Manish Singh',
  location: 'Patna, Bihar, India',
  phone: '+91 8294068776',
  // Sirf asli URLs daalo. Khali ('') rakhoge to link dikhega hi nahi.
  social: {
    github: 'https://github.com/manishs72660-collab',
    linkedin: 'https://www.linkedin.com/in/manish-singh-b1b601385/',
    leetcode: 'https://leetcode.com/u/manishsingh18/',
    email: 'manishs72660@gmail.com',
  },

  headline: 'Software Engineer | Full-Stack Developer | AI Enthusiast',
  subtitle: "I'm a BCA student and developer from Patna who enjoys building full-stack applications, exploring AI-powered systems, and improving backend performance.",
  support: 'From interactive web applications to backend performance experiments, I enjoy turning ideas into practical, well-engineered products.',
  status: 'Currently Exploring Backend Performance & AI Integration',
  seo: 'Manish Singh is a BCA student and developer from Bihar, India, exploring full-stack development, backend engineering, AI integration, database optimization, and reliable software systems.',

  about: [
    'Hey, I\'m Manish Singh, a developer from Patna, Bihar, India, currently pursuing a Bachelor of Computer Applications.',
    'I enjoy building full-stack applications and exploring the engineering concepts that make software reliable, maintainable, and scalable.',
    'My interests include backend development, database management, API design, real-time systems, AI-powered applications, and performance optimization.',
    'Through my projects, I have explored technologies such as React, Node.js, Express.js, MongoDB, Redis, Socket.IO, and external API integrations. I am also expanding my knowledge of PostgreSQL, Docker, Nginx, load testing, monitoring, and cloud deployment.',
    'I believe in learning by building, experimenting, testing, debugging, and continuously improving.',
    'Beyond writing code, I want to understand why systems behave the way they do and how to make them better.',
  ],

  // TODO verify: institute, university, CGPA aur graduation year (aapke diye hue details hain)
  education: {
    degree: 'Bachelor of Computer Applications (BCA)',
    institute: 'Satyam International Institute of Technology, Patna',
    university: 'Aryabhatta Knowledge University (AKU)',
    graduation: '2024–2027', cgpa: '8.5 (previously reported)', location: 'Patna, Bihar, India',
    interests: ['Data Structures and Algorithms', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Object-Oriented Programming', 'Software Engineering', 'System Design'],
  },

  skills: {
    'Used in projects': ['JavaScript', 'C++', 'HTML', 'CSS', 'React', 'Tailwind CSS', 'Vite', 'Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'Redis', 'Socket.IO', 'JWT', 'Judge0 API', 'Gemini API', 'Cloudinary', 'Docker', 'AWS EC2', 'Git', 'GitHub', 'Postman', 'VS Code'],
    'Currently learning': ['PostgreSQL', 'Nginx', 'CI/CD', 'k6', 'Grafana', 'Load testing', 'PostgreSQL query optimization'],
    'CS fundamentals': ['Data Structures and Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Object-Oriented Programming'],
  },

  // TODO verify: features ko source code se match karo (implemented / planned)
  projects: [
    {
      _id: 'codemaster', slug: 'codemaster', title: 'CodeMaster', category: 'Full-Stack / Coding Platform',
      description: 'CodeMaster is a college-focused coding platform designed to help students practice programming, participate in contests, compete in coding duels, and collaborate with other learners.',
      techStack: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Redis', 'Socket.IO', 'Judge0 API', 'Gemini API', 'Cloudinary', 'Docker', 'AWS'],
      features: ['Role-based access for platform admins, college admins and students', 'College registration and approval workflow', 'Online code execution and evaluation via Judge0 API', 'Real-time chat and coding duels with Socket.IO', 'Public and private contests', 'Problem management and admin dashboard', 'Student discussion board', 'AI-powered coding assistant', 'Pseudocode whiteboard', 'Video solutions via Cloudinary', 'Role-restricted reference solutions', 'Redis-based rate limiting', 'Docker setup and AWS deployment'],
      githubUrl: '', liveUrl: '',
    },
    {
      _id: 'radar', slug: 'radar', title: 'Radar', category: 'Monitoring / Backend Reliability',
      description: 'Radar is a project focused on application availability, proactive alerts, and managing idle application resources.',
      techStack: [], // TODO: source code se confirm karke daalo
      features: ['Cold-start and sleep scheduling', 'Idle-period management for free-tier resources', 'Telegram notifications when an app goes down', 'Email alerts for downtime', 'Sliding-window rate limiting'],
      githubUrl: '', liveUrl: '',
    },
    {
      _id: 'agenza', slug: 'agenza', title: 'Agenza', category: 'In progress',
      description: 'Project details will be added soon.', // PLACEHOLDER: asli description repo se likho
      techStack: [], features: [], githubUrl: '', liveUrl: '',
    },
  ],

  lab: {
    title: 'PostgreSQL performance experiments',
    text: 'I am exploring PostgreSQL through hands-on database experiments, large datasets, SQL query optimization, and backend performance testing. My recent learning includes load testing with k6, observing performance metrics with Grafana, and identifying opportunities to improve query execution and response times.',
    topics: ['PostgreSQL database setup', 'Large dataset experiments', 'SQL query optimization', 'Database benchmarking', 'k6 load testing', 'Grafana monitoring', 'Response-time analysis'],
    note: 'Ongoing experiment. Benchmark results will be published once verified.',
  },

  coding: { solved: 512, language: 'C++', topics: ['Arrays', 'Strings', 'Stacks', 'Queues', 'Trees', 'Graphs'] }, // solved: edit karte raho

  journey: [
    ['Programming Fundamentals', 'Learning programming, C++, data structures, algorithms, and core computer science concepts.'],
    ['Full-Stack Development', 'Exploring React, JavaScript, Node.js, Express.js, REST APIs, and database integration.'],
    ['Building Real Projects', 'Working on CodeMaster and exploring authentication, role-based permissions, external APIs, real-time communication, and application deployment.'],
    ['Backend Engineering', 'Exploring Redis, PostgreSQL, SQL optimization, rate limiting, and API performance.'],
    ['Reliability and Observability', 'Learning about k6, Grafana, Nginx, Docker, monitoring, alerting, and resource management.'],
    ['AI-Powered Development', 'Exploring AI integration and intelligent features in applications.'],
  ],

  journalIdeas: ['Building a College Coding Platform', 'Integrating Judge0 API', 'Real-Time Features with Socket.IO', 'Redis-Based Rate Limiting', 'PostgreSQL vs MongoDB: Practical Learning', 'Load Testing Node.js APIs with k6', 'Monitoring Applications with Grafana', 'Understanding Nginx Reverse Proxy', 'Dockerizing a Node.js Application', 'Telegram and Email Downtime Alerts', 'AI Integration in Full-Stack Apps', 'Learning System Design Through Projects'],
};