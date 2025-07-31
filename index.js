const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      works: [],
      skills: {},
      education: [],
      experience: []
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data', (req, res) => {
  res.json(loadData());
});

// Admin routes
app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// GET routes for admin sections
app.get('/admin/work', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/skill', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/education', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/experience', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Authentication
app.post('/admin/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  if (username === 'baghdad' && password === 'baghdad') {
    req.session.loggedIn = true;
    console.log('Login successful');
    res.redirect('/admin');
  } else {
    console.log('Login failed');
    res.redirect('/admin');
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

// Data management routes
app.post('/admin/work', upload.array('images'), (req, res) => {
  console.log('POST /admin/work called');
  console.log('Session logged in:', req.session.loggedIn);
  console.log('Request body:', req.body);
  console.log('Files:', req.files);
  
  if (!req.session.loggedIn) {
    console.log('Unauthorized access attempt');
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const data = loadData();
    const { title, description, client, links, link } = req.body;

    const images = [];

    // Parse image links from textarea (comma or newline separated)
    const linkInput = links || link || '';
    if (linkInput) {
      const parts = Array.isArray(linkInput) ? linkInput : [linkInput];
      parts.forEach(p => {
        p.split(/[,\n]/).forEach(l => {
          const trimmed = l.trim();
          if (trimmed) images.push(trimmed);
        });
      });
    }

    // Handle uploaded files
    if (req.files) {
      req.files.forEach(file => {
        images.push('/uploads/' + file.filename);
      });
    }

    const newWork = { title, description, client, images };
    data.works.push(newWork);
    saveData(data);
    
    console.log('Work added successfully:', newWork);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding work:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/admin/skill', (req, res) => {
  console.log('POST /admin/skill called');
  console.log('Session logged in:', req.session.loggedIn);
  console.log('Request body:', req.body);
  
  if (!req.session.loggedIn) {
    console.log('Unauthorized access attempt');
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const data = loadData();
    const { category, tags } = req.body;
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!data.skills[category]) {
      data.skills[category] = [];
    }
    data.skills[category] = data.skills[category].concat(tagList);
    
    saveData(data);
    console.log('Skill added successfully');
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/admin/education', (req, res) => {
  console.log('POST /admin/education called');
  
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const data = loadData();
    const { date, title, subtitle, description } = req.body;
    data.education.push({ date, title, subtitle, description });
    saveData(data);
    console.log('Education added successfully');
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/admin/experience', (req, res) => {
  console.log('POST /admin/experience called');
  
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const data = loadData();
    const { date, title, subtitle, description } = req.body;
    data.experience.push({ date, title, subtitle, description });
    saveData(data);
    console.log('Experience added successfully');
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  / (home page)');
  console.log('- GET  /admin (admin dashboard)');
  console.log('- POST /admin/login');
  console.log('- POST /admin/work');
  console.log('- POST /admin/skill');
  console.log('- POST /admin/education');
  console.log('- POST /admin/experience');
});