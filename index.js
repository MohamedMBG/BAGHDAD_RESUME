const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', (req, res) => {
  res.json(loadData());
});

app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'baghdad' && password === 'baghdad') {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin');
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

app.post('/admin/work', upload.single('image'), (req, res) => {
  if (!req.session.loggedIn) return res.status(401).send('Unauthorized');
  const data = loadData();
  const { title, description, client, link } = req.body;
  let image = link;
  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }
  data.works.push({ title, description, client, image });
  saveData(data);
  res.redirect('/admin');
});

app.post('/admin/skill', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).send('Unauthorized');
  const data = loadData();
  const { category, tags } = req.body;
  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  data.skills[category] = (data.skills[category] || []).concat(tagList);
  saveData(data);
  res.redirect('/admin');
});

app.post('/admin/education', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).send('Unauthorized');
  const data = loadData();
  const { date, title, subtitle, description } = req.body;
  data.education.push({ date, title, subtitle, description });
  saveData(data);
  res.redirect('/admin');
});

app.post('/admin/experience', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).send('Unauthorized');
  const data = loadData();
  const { date, title, subtitle, description } = req.body;
  data.experience.push({ date, title, subtitle, description });
  saveData(data);
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});