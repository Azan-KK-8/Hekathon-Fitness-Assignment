class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

// Handles all daily-plan related data: habits, water, goal
class FitnessTracker {
  constructor(data) {
    data = data || {};
    this.goal = data.goal || 'Build Muscle';
    this.habits = data.habits || { workout: false, meal: false, water: false, steps: false, sleep: false };
    this.water = data.water !== undefined ? data.water : 6;
    this.waterMax = 8;
    this.bmi = data.bmi || { value: null, category: null };
    this.calories = data.calories || null;
  }

  setGoal(goal) {
    this.goal = goal;
  }

  toggleHabit(key) {
    this.habits[key] = !this.habits[key];
  }

  getCompletedCount() {
    return Object.values(this.habits).filter(Boolean).length;
  }

  getTotalHabits() {
    return Object.keys(this.habits).length;
  }

  addWater() {
    if (this.water < this.waterMax) {
      this.water++;
      return true;
    }
    return false;
  }

  removeWater() {
    if (this.water > 0) {
      this.water--;
      return true;
    }
    return false;
  }

  calculateBMI(heightCm, weightKg) {
    const heightM = heightCm / 100;
    const bmiValue = weightKg / (heightM * heightM);
    let category;
    if (bmiValue < 18.5) category = 'Underweight';
    else if (bmiValue < 25) category = 'Normal';
    else if (bmiValue < 30) category = 'Overweight';
    else category = 'Obese';

    this.bmi = { value: parseFloat(bmiValue.toFixed(1)), category: category };
    return this.bmi;
  }

  calculateCalories(age, gender, heightCm, weightKg, activityLevel) {
    let bmr;
    if (gender === 'Male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    this.calories = Math.round(bmr * activityLevel);
    return this.calories;
  }
}

// Handles the simple predefined chatbot responses
class Chatbot {
  getResponse(topic) {
    switch (topic) {
      case 'Workout':
        return "Today's workout is Full Body Strength.";
      case 'Diet':
        return "Try a balanced meal with protein and vegetables.";
      case 'Water':
        return "Your daily target is around 8 glasses.";
      case 'BMI':
        return "Use the BMI calculator to check your BMI.";
      default:
        return "I'm not sure about that yet, but I'm here to help with workouts, diet, water and BMI!";
    }
  }
}

// Main app controller — handles UI + localStorage + ties classes together
class FitnexApp {
  constructor() {
    this.storageKey = 'fitnexApp';
    this.user = null;
    this.tracker = null;
    this.chatbot = new Chatbot();
    this.load();
  }

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        this.user = data.user ? new User(data.user.name, data.user.email) : null;
        this.tracker = new FitnessTracker(data.tracker);
      } catch (e) {
        this.tracker = new FitnessTracker();
      }
    } else {
      this.tracker = new FitnessTracker();
    }
  }

  save() {
    const data = {
      user: this.user,
      tracker: this.tracker
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /* ---------- Toast ---------- */
  showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  /* ---------- Auth screen ---------- */
  showAuthPane(which) {
    document.getElementById('btnShowLogin').classList.toggle('active', which === 'login');
    document.getElementById('btnShowRegister').classList.toggle('active', which === 'register');
    document.getElementById('paneLogin').classList.toggle('active', which === 'login');
    document.getElementById('paneRegister').classList.toggle('active', which === 'register');
  }

  login() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { this.showToast('Please enter your email'); return; }
    const namePart = email.split('@')[0];
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    this.user = new User(name, email);
    this.save();
    this.enterApp();
  }

  register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    if (!name || !email || !pass) { this.showToast('Please fill in all fields'); return; }
    if (pass !== confirm) { this.showToast('Passwords do not match'); return; }
    this.user = new User(name, email);
    this.save();
    this.showToast('Account created!');
    this.enterApp();
  }

  logout() {
    this.goTo('screen-auth');
  }

  enterApp() {
    this.refreshAll();
    this.goTo('screen-home');
  }

  /* ---------- Navigation ---------- */
  goTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    document.querySelectorAll('.topnav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.target === screenId);
    });
    document.querySelectorAll('.bnav-item-c').forEach(el => {
      el.classList.toggle('active', el.dataset.target === screenId);
    });
  }

  /* ---------- Goals screen ---------- */
  selectGoal(goal) {
    this.tracker.setGoal(goal);
    this.save();
    document.querySelectorAll('.goal-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.goal === goal);
    });
    document.getElementById('homeGoal').textContent = goal;
    this.showToast('Goal set: ' + goal);
  }

  calculateBMI() {
    const h = parseFloat(document.getElementById('bmiHeight').value);
    const w = parseFloat(document.getElementById('bmiWeight').value);
    if (!h || !w) { this.showToast('Enter height and weight'); return; }
    const result = this.tracker.calculateBMI(h, w);
    this.save();

    document.getElementById('bmiResult').style.display = 'block';
    document.getElementById('bmiValue').textContent = result.value;
    document.getElementById('bmiCategory').textContent = result.category;
  }

  calculateCalories() {
    const age = parseFloat(document.getElementById('calAge').value);
    const gender = document.getElementById('calGender').value;
    const h = parseFloat(document.getElementById('calHeight').value);
    const w = parseFloat(document.getElementById('calWeight').value);
    const activity = parseFloat(document.getElementById('calActivity').value);
    if (!age || !h || !w) { this.showToast('Please fill all fields'); return; }

    const total = this.tracker.calculateCalories(age, gender, h, w, activity);
    this.save();

    document.getElementById('calResult').style.display = 'block';
    document.getElementById('calValue').textContent = total.toLocaleString();
  }

  /* ---------- Daily Plan screen ---------- */
  completeWorkout() {
    this.tracker.habits.workout = true;
    this.save();
    this.renderTracker();
    this.showToast("Workout completed — great job!");
  }

  toggleHabit(el) {
    const key = el.dataset.habit;
    this.tracker.toggleHabit(key);
    this.save();
    this.renderTracker();
  }

  renderTracker() {
    document.querySelectorAll('.check-row').forEach(el => {
      const key = el.dataset.habit;
      el.classList.toggle('done', !!this.tracker.habits[key]);
    });
    const done = this.tracker.getCompletedCount();
    const total = this.tracker.getTotalHabits();
    document.getElementById('trackerCountText').textContent = `${done} / ${total} Completed`;
    const pct = Math.round((done / total) * 100);
    document.getElementById('trackerBar').style.width = pct + '%';
  }

  addWater() {
    if (this.tracker.addWater()) {
      this.save();
      this.renderWater();
      this.showToast('Glass added!');
    } else {
      this.showToast('Daily water goal reached!');
    }
  }

  removeWater() {
    this.tracker.removeWater();
    this.save();
    this.renderWater();
  }

  renderWater() {
    const row = document.getElementById('waterRow');
    row.innerHTML = '';
    for (let i = 0; i < this.tracker.waterMax; i++) {
      const filled = i < this.tracker.water;
      const d = document.createElement('div');
      d.className = 'water-drop-c' + (filled ? ' filled' : '');
      d.innerHTML = '<i class="bi bi-droplet-fill"></i>';
      row.appendChild(d);
    }
    document.getElementById('waterCountText').textContent = `${this.tracker.water} / ${this.tracker.waterMax} Glasses`;
  }

  /* ---------- Progress screen chatbot ---------- */
  askAssistant(topic) {
    this.appendChatMsg(topic, 'user');
    const reply = this.chatbot.getResponse(topic);
    setTimeout(() => this.appendChatMsg(reply, 'bot'), 400);
  }

  appendChatMsg(text, who) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'msg-c ' + (who === 'user' ? 'msg-user-c' : 'msg-bot-c');
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  /* ---------- Refresh everything from state ---------- */
  refreshAll() {
    if (this.user) {
      const initial = this.user.name.charAt(0).toUpperCase();
      document.getElementById('avatarGoals').textContent = initial;
      document.getElementById('avatarHome').textContent = initial;
      document.getElementById('homeGreeting').textContent = `Hi, ${this.user.name} 👋`;
    }
    document.getElementById('homeGoal').textContent = this.tracker.goal;
    document.querySelectorAll('.goal-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.goal === this.tracker.goal);
    });

    if (this.tracker.bmi && this.tracker.bmi.value) {
      document.getElementById('bmiResult').style.display = 'block';
      document.getElementById('bmiValue').textContent = this.tracker.bmi.value;
      document.getElementById('bmiCategory').textContent = this.tracker.bmi.category;
    }
    if (this.tracker.calories) {
      document.getElementById('calResult').style.display = 'block';
      document.getElementById('calValue').textContent = this.tracker.calories.toLocaleString();
    }

    this.renderTracker();
    this.renderWater();
  }
}

/* Instantiate the app controller */
const ui = new FitnexApp();

document.addEventListener('DOMContentLoaded', () => {
  ui.refreshAll();
});
