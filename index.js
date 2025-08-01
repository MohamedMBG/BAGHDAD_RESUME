const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
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

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/data', (req, res) => {
  res.json(loadData());
});

// Admin routes
app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'login.html'));
  }
});

// Admin sub-routes all render the same admin.html if logged in
const adminSections = ['work', 'skill', 'education', 'experience'];
adminSections.forEach(section => {
  app.get(`/admin/${section}`, (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/admin');
    res.sendFile(path.join(__dirname, 'admin.html'));
  });
});

// Authentication
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'baghdad' && password === 'baghdad') {
    req.session.loggedIn = true;
  }
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

// Add work
app.post('/admin/work', upload.array('images'), (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const data = loadData();
    const { title, description, client, links, link } = req.body;

    const images = [];
    const linkInput = links || link || '';
    const parts = Array.isArray(linkInput) ? linkInput : [linkInput];
    parts.forEach(p => {
      p.split(/[,\n]/).forEach(l => {
        const trimmed = l.trim();
        if (trimmed) images.push(trimmed);
      });
    });

    if (req.files) {
      req.files.forEach(file => {
        images.push('/uploads/' + file.filename);
      });
    }

    const newWork = { title, description, client, images };
    data.works.push(newWork);
    saveData(data);

    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding work:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add skill
app.post('/admin/skill', (req, res) => {
  if (!req.session.loggedIn) {
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
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add education
app.post('/admin/education', (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const data = loadData();
    const { date, title, subtitle, description } = req.body;
    data.education.push({ date, title, subtitle, description });
    saveData(data);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add experience
app.post('/admin/experience', (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const data = loadData();
    const { date, title, subtitle, description } = req.body;
    data.experience.push({ date, title, subtitle, description });
    saveData(data);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
