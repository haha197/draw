// 1. 初始化 Supabase
const SUPABASE_URL = 'https://yjgctujlqebbnsbkguke.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Cm-cXMLUshA1ppRXwcrytA_jblbiyGH';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');

// 設置畫布大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let lastPos = { x: 0, y: 0 };

// 2. 訂閱 Supabase Broadcast 頻道
const channel = supabase.channel('drawing_room', {
  config: {
    broadcast: { self: false }, // 不發送給自己，因為本地已經畫過了
  },
});

channel
  .on('broadcast', { event: 'draw' }, (payload) => {
    const { from, to, color } = payload.payload;
    drawLine(from, to, color, false); // 繪製來自他人的線條
  })
  .subscribe();

// 3. 繪圖函數
function drawLine(from, to, color, emit = true) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.closePath();

  // 如果是自己在畫，則廣播坐標
  if (emit) {
    channel.send({
      type: 'broadcast',
      event: 'draw',
      payload: { from, to, color },
    });
  }
}

// 4. 滑鼠事件監聽
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  lastPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;

  const currentPos = { x: e.clientX, y: e.clientY };
  const color = colorPicker.value;

  drawLine(lastPos, currentPos, color, true);
  lastPos = currentPos;
});

window.addEventListener('mouseup', () => {
  drawing = false;
});

// 清除畫布（僅限本地）
clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 處理窗口縮放
window.addEventListener('resize', () => {
  // 注意：縮放會清空畫布內容，實際應用中需緩存圖像數據
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
