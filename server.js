const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const http = require('http'); // 添加http模块
const WebSocket = require('ws'); // 添加ws模块

const app = express();
const port = 3000;

// 启用CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置存储位置和文件名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 设置上传文件的存储路径
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // 使用当前时间戳作为文件名
    }
});

const upload = multer({ storage: storage });

// 创建上传文件夹
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// 处理文件上传的路由
app.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ message: 'File uploaded successfully', file: req.file });
    } else {
        res.status(400).json({ message: 'File upload failed' });
    }
});

// 处理读取txt文件内容的路由
app.get('/read-txt', (req, res) => {
    const filePath = path.join(__dirname, 'infoText.txt'); // 假设txt文件名为data.txt
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading file', error: err });
        }
        res.json({ content: data });
    });
});

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // 每隔1秒向客户端发送消息
    const interval = setInterval(() => {
        const filePath = path.join(__dirname, 'infoText.txt');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                ws.send(JSON.stringify({ message: 'Error reading file' }));
            } else {
                ws.send(JSON.stringify({ message: data }));
            }
        });
    }, 1000);

    // 清除间隔以防止内存泄漏
    ws.on('close', () => {
        clearInterval(interval);
    });

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });
});

// 启动服务器
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});