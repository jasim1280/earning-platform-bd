import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";

const DB_FILE = path.join(process.cwd(), "db.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // In-memory database with file persistence
  let db = {
    users: {
      admin: {
        username: 'admin',
        password: 'password.123456',
        balance: 0,
        totalEarned: 0,
        hasDeposited: true,
        joinedAt: new Date().toISOString(),
        referralCode: 'ADMIN',
        referredBy: null
      }
    } as any,
    transactions: {} as any,
    tasks: [] as any[],
    completedTasks: {} as any, // { username: [taskId1, taskId2] }
    taskSubmissions: [] as any[], // [{ id, username, taskId, screenshot, status, timestamp }]
    adminSettings: {
      Bkash: '01700000000',
      Nagad: '01800000000',
      Rocket: '01900000000',
      telegramLink: 'https://t.me/your_support_link',
      depositNotice: '৩০০ টাকা সেন্ড মানি করলে টাস্ক আনলক হবে।',
      withdrawNotice: 'উইথড্র করার আগে ব্যালেন্স চেক করুন।',
      taskNotice: 'ডিপোজিট না করলে টাস্ক পাবেন না।'
    }
  };

  // Load DB from file if exists
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const loadedDb = JSON.parse(data);
      db = { 
        ...db, 
        ...loadedDb,
        adminSettings: { ...db.adminSettings, ...(loadedDb.adminSettings || {}) }
      };
      // Ensure admin user exists and has the correct password
      if (!db.users.admin) {
        db.users.admin = {
          username: 'admin',
          password: 'password.123456',
          balance: 0,
          totalEarned: 0,
          hasDeposited: true,
          joinedAt: new Date().toISOString(),
          referralCode: 'ADMIN',
          referredBy: null
        };
      } else {
        db.users.admin.password = 'password.123456';
      }
    } catch (e) {
      console.error("Failed to load database file:", e);
    }
  }

  const saveDb = () => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error("Failed to save database file:", e);
    }
  };

  // API Routes
  app.get("/api/admin/settings", (req, res) => {
    res.json(db.adminSettings);
  });

  app.post("/api/admin/settings", (req, res) => {
    const { Bkash, Nagad, Rocket, telegramLink, depositNotice, withdrawNotice, taskNotice } = req.body;
    db.adminSettings = { Bkash, Nagad, Rocket, telegramLink, depositNotice, withdrawNotice, taskNotice };
    saveDb();
    res.json({ message: "Settings updated", settings: db.adminSettings });
  });

  app.get("/api/admin/requests", (req, res) => {
    const allRequests: any[] = [];
    
    // Transactions (Deposits/Withdrawals)
    Object.keys(db.transactions).forEach(username => {
      db.transactions[username].forEach((tx: any) => {
        if (tx.status === 'pending') {
          allRequests.push({ ...tx, username, requestType: 'transaction' });
        }
      });
    });

    // Task Submissions
    db.taskSubmissions.forEach((sub: any) => {
      if (sub.status === 'pending') {
        const task = db.tasks.find(t => t.id === sub.taskId);
        allRequests.push({ 
          ...sub, 
          requestType: 'task', 
          amount: task?.reward || 0,
          title: task?.title || 'Unknown Task'
        });
      }
    });

    res.json(allRequests.sort((a, b) => b.timestamp - a.timestamp));
  });

  app.post("/api/admin/approve", (req, res) => {
    const { username, txId, requestId, requestType } = req.body;

    if (requestType === 'task') {
      const subIndex = db.taskSubmissions.findIndex((s: any) => s.id === requestId);
      if (subIndex === -1) return res.status(404).json({ error: "Submission not found" });
      
      const sub = db.taskSubmissions[subIndex];
      sub.status = 'completed';

      const task = db.tasks.find(t => t.id === sub.taskId);
      if (task) {
        db.users[sub.username].balance += task.reward;
        db.users[sub.username].totalEarned += task.reward;
        if (!db.completedTasks[sub.username]) db.completedTasks[sub.username] = [];
        db.completedTasks[sub.username].push(sub.taskId);

        // Add transaction record
        const newTx = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'task',
          amount: task.reward,
          timestamp: Date.now(),
          status: 'completed',
          title: task.title
        };
        if (!db.transactions[sub.username]) db.transactions[sub.username] = [];
        db.transactions[sub.username].unshift(newTx);
      }
      
      saveDb();
      return res.json({ message: "Task approved" });
    }

    // Default transaction approval
    const userTxs = db.transactions[username];
    if (!userTxs) return res.status(404).json({ error: "User not found" });

    const txIndex = userTxs.findIndex((t: any) => t.id === txId);
    if (txIndex === -1) return res.status(404).json({ error: "Transaction not found" });

    const tx = userTxs[txIndex];
    tx.status = 'completed';

    // If it's a deposit, add balance
    if (tx.type === 'deposit') {
      db.users[username].balance += tx.amount;
      db.users[username].totalEarned += tx.amount;
      db.users[username].hasDeposited = true;
    }

    saveDb();
    res.json({ message: "Request approved" });
  });

  app.post("/api/admin/reject", (req, res) => {
    const { username, txId, requestId, requestType } = req.body;

    if (requestType === 'task') {
      const subIndex = db.taskSubmissions.findIndex((s: any) => s.id === requestId);
      if (subIndex === -1) return res.status(404).json({ error: "Submission not found" });
      db.taskSubmissions[subIndex].status = 'rejected';
      saveDb();
      return res.json({ message: "Task rejected" });
    }

    const userTxs = db.transactions[username];
    if (!userTxs) return res.status(404).json({ error: "User not found" });

    const txIndex = userTxs.findIndex((t: any) => t.id === txId);
    if (txIndex === -1) return res.status(404).json({ error: "Transaction not found" });

    const tx = userTxs[txIndex];
    tx.status = 'rejected';

    // If it's a withdrawal, refund balance
    if (tx.type === 'withdrawal') {
      db.users[username].balance += tx.amount;
    }

    saveDb();
    res.json({ message: "Request rejected" });
  });

  // Task Management
  app.get("/api/tasks", (req, res) => {
    res.json(db.tasks);
  });

  app.post("/api/admin/tasks", (req, res) => {
    const { title, description, reward, link, type } = req.body;
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      reward: Number(reward),
      link,
      type,
      timestamp: Date.now()
    };
    db.tasks.push(newTask);
    saveDb();
    res.json(newTask);
  });

  app.delete("/api/admin/tasks/:id", (req, res) => {
    db.tasks = db.tasks.filter(t => t.id !== req.params.id);
    saveDb();
    res.json({ message: "Task deleted" });
  });

  app.post("/api/user/complete-task", (req, res) => {
    const { username, taskId } = req.body;
    if (!db.users[username]) return res.status(404).json({ error: "User not found" });
    
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!db.completedTasks[username]) db.completedTasks[username] = [];
    if (db.completedTasks[username].includes(taskId)) {
      return res.status(400).json({ error: "Task already completed" });
    }

    db.users[username].balance += task.reward;
    db.users[username].totalEarned += task.reward;
    db.completedTasks[username].push(taskId);

    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'task',
      amount: task.reward,
      timestamp: Date.now(),
      status: 'completed',
      title: task.title
    };

    if (!db.transactions[username]) db.transactions[username] = [];
    db.transactions[username].unshift(newTx);

    saveDb();
    res.json({ user: db.users[username], transactions: db.transactions[username], completedTasks: db.completedTasks[username] });
  });

  app.get("/api/user/:username/completed-tasks", (req, res) => {
    res.json(db.completedTasks[req.params.username] || []);
  });

  app.post("/api/user/submit-task-proof", (req, res) => {
    const { username, taskId, screenshot } = req.body;
    if (!db.users[username]) return res.status(404).json({ error: "User not found" });
    
    if (!db.users[username].hasDeposited) {
      return res.status(403).json({ error: "You must deposit at least 300 Taka to perform tasks." });
    }

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!db.completedTasks[username]) db.completedTasks[username] = [];
    if (db.completedTasks[username].includes(taskId)) {
      return res.status(400).json({ error: "Task already completed" });
    }

    const alreadySubmitted = db.taskSubmissions.find(s => s.username === username && s.taskId === taskId && s.status === 'pending');
    if (alreadySubmitted) {
      return res.status(400).json({ error: "Proof already submitted and pending review" });
    }

    const newSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      taskId,
      screenshot,
      status: 'pending',
      timestamp: Date.now()
    };

    db.taskSubmissions.push(newSubmission);
    saveDb();
    res.json({ message: "Proof submitted successfully" });
  });

  app.get("/api/user/:username/pending-tasks", (req, res) => {
    const pending = db.taskSubmissions
      .filter(s => s.username === req.params.username && s.status === 'pending')
      .map(s => s.taskId);
    res.json(pending);
  });

  app.post("/api/auth/signup", (req, res) => {
    const { username, password, referralCode } = req.body;
    if (db.users[username]) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      username,
      password,
      balance: 0,
      totalEarned: 0,
      hasDeposited: false,
      joinedAt: new Date().toISOString(),
      referralCode: (username.toUpperCase().slice(0, 4) + Math.random().toString(36).substr(2, 4).toUpperCase()),
      referredBy: null as string | null,
    };

    // Handle Referral
    if (referralCode) {
      const referrerName = Object.keys(db.users).find(
        name => db.users[name].referralCode === referralCode.toUpperCase()
      );
      if (referrerName) {
        db.users[referrerName].balance += 100;
        db.users[referrerName].totalEarned += 100;
        newUser.referredBy = referrerName;
        
        // Add transaction for referrer
        if (!db.transactions[referrerName]) db.transactions[referrerName] = [];
        db.transactions[referrerName].unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'referral',
          amount: 100,
          timestamp: Date.now(),
          status: 'completed'
        });
      }
    }

    db.users[username] = newUser;
    db.transactions[username] = [];
    saveDb();
    res.json(newUser);
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.users[username];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json(user);
  });

  app.get("/api/user/:username", (req, res) => {
    const user = db.users[req.params.username];
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const referralCount = Object.values(db.users).filter((u: any) => u.referredBy === req.params.username).length;
    
    const responseData: any = { 
      user: { ...user, referralCount }, 
      transactions: db.transactions[req.params.username] || [] 
    };

    if (req.params.username === 'admin') {
      responseData.totalUsers = Object.keys(db.users).length;
    }

    res.json(responseData);
  });

  app.post("/api/user/reward", (req, res) => {
    const { username, amount, type } = req.body;
    if (!db.users[username]) return res.status(404).json({ error: "User not found" });
    
    db.users[username].balance += amount;
    db.users[username].totalEarned += amount;
    
    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      timestamp: Date.now(),
      status: 'completed'
    };
    
    if (!db.transactions[username]) db.transactions[username] = [];
    db.transactions[username].unshift(newTx);
    
    saveDb();
    res.json({ user: db.users[username], transactions: db.transactions[username] });
  });

  app.post("/api/user/withdraw", (req, res) => {
    const { username, amount, method, phone } = req.body;
    if (!db.users[username]) return res.status(404).json({ error: "User not found" });
    if (db.users[username].balance < amount) return res.status(400).json({ error: "Insufficient balance" });
    
    db.users[username].balance -= amount;
    
    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'withdrawal',
      amount,
      method,
      phone,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    if (!db.transactions[username]) db.transactions[username] = [];
    db.transactions[username].unshift(newTx);
    
    saveDb();
    res.json({ user: db.users[username], transactions: db.transactions[username] });
  });

  app.post("/api/user/deposit", (req, res) => {
    const { username, amount, method, trxId, screenshot } = req.body;
    if (!db.users[username]) return res.status(404).json({ error: "User not found" });
    
    if (amount < 300) {
      return res.status(400).json({ error: "Minimum deposit amount is 300 Taka." });
    }

    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'deposit',
      amount,
      method,
      trxId,
      screenshot,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    if (!db.transactions[username]) db.transactions[username] = [];
    db.transactions[username].unshift(newTx);
    
    saveDb();
    res.json({ user: db.users[username], transactions: db.transactions[username] });
  });

  app.get("/api/leaderboard", (req, res) => {
    const list = Object.values(db.users)
      .map((u: any) => ({ username: u.username, balance: u.balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
    res.json(list);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
