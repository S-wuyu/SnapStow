"use strict";

const byId = (id) => document.getElementById(id);
const screen = byId("screen");
const chat = byId("chat-window");
const chatStack = byId("chat-stack");
const chatHandle = byId("chat-handle");
const chatDetail = byId("chat-detail");
const threadSearch = byId("thread-search");
const bench = byId("workbench");
const messages = byId("messages");
const messageItems = byId("message-items");
const selection = byId("selection");
const capture = byId("capture");
const desktopGuide = byId("desktop-guide");
const desktopCue = byId("desktop-cue");
const queueExample = byId("try-queue");
const archiveExample = byId("try-archive");
const tray = byId("tray-app");
const queue = byId("queue");
const board = byId("board");
const belt = byId("belt");
const boxes = byId("boxes");
const dropBin = byId("drop-bin");
const archive = byId("archive");
const archiveContent = byId("archive-content");
const underlay = byId("archive-underlay");
const preview = byId("preview");
const cut = byId("cut");
const folder = byId("explorer");
const directoryButton = byId("explorer-choose");
const trayMenu = byId("tray-menu");
const warehouseDoor = byId("warehouse-door");
const desktopTagline = desktopCue.textContent;

const names = {
  dev: "支付改版研发群",
  feedback: "支付联调反馈群",
  temp: "临时会话",
  launch: "上线准备群",
};
const environmentUrl = "https://pay.example.com/staging";
const environmentChat = [
  "联调环境开好了，大家可以开始验收了。",
  "名称：支付新版联调",
  "网址：" + environmentUrl,
  "账号：demo-tester",
  "密码：demo-only",
].join("\n");
const channels = {
  dev: ["environment", "note", "sheet", "missing"],
  temp: ["brief"],
  feedback: ["feedbackNote", "feedbackSheet"],
  launch: ["launchNote", "launchFile"],
};
const clients = {
  wechat: { title: "微信", groups: ["dev", "temp"], sender: "林一", members: ["林一", "李梓", "夏然"], heading: "最近会话", workspace: "" },
  dingtalk: { title: "钉钉", groups: ["feedback"], sender: "许舟", members: ["许舟", "赵乔", "白薇"], heading: "协作消息", workspace: "产品研发 · 项目群" },
  wecom: { title: "企业微信", groups: ["launch"], sender: "周宁", members: ["周宁", "赵乔", "徐遥", "顾凡"], heading: "消息", workspace: "研发中心 · 内部群" },
};
const sampleReplies = {
  dev: "收到，我按清单验证一下。",
  feedback: "收到，复测结果我会补到表里。",
  launch: "交接表收到了，明早见。",
};
const fixtures = {
  note: { name: "验收备注", source: "dev", body: "这周先用下面这版清单验收。", kind: "note" },
  sheet: { name: "验收清单.xlsx", source: "dev", body: "本地已下载 · 48 KB", kind: "file", icon: "X" },
  environment: { name: "联调环境消息", source: "dev", body: environmentChat, kind: "environment", includes: ["link", "credential"] },
  link: { name: "测试环境网址", source: "dev", body: environmentUrl, kind: "link" },
  credential: { name: "支付联调测试账号", source: "dev", body: environmentChat, kind: "credential" },
  missing: { name: "回归录屏.mp4", source: "dev", body: "尚未下载 · 8.4 MB", kind: "missing", icon: "↓" },
  brief: { name: "联调记录.pdf", source: "temp", body: "本地已下载 · 126 KB", kind: "file", icon: "P" },
  old: { name: "接口清单.xlsx", source: "dev", body: "旧版 · 26 KB", kind: "file", icon: "X" },
  new: { name: "接口清单.xlsx", source: "dev", body: "新版 · 34 KB", kind: "file", icon: "X" },
  review: { name: "验收记录.pdf", source: "temp", body: "本地已下载 · 126 KB", kind: "file", icon: "P" },
  feedback: { name: "反馈记录.md", source: "feedback", body: "空状态文案和按钮分组已复核。", kind: "note" },
  query: { name: "交接说明.docx", source: "launch", body: "上线准备 · 32 KB", kind: "file", icon: "W" },
  failed: { name: "回归记录.xlsx", source: "dev", body: "本地已下载 · 52 KB", kind: "file", icon: "X" },
  feedbackNote: { name: "联调反馈备注", source: "feedback", body: "今天的联调反馈我汇总好了，会上可以按这版核对。", kind: "note" },
  feedbackSheet: { name: "联调反馈汇总.xlsx", source: "feedback", body: "本地已下载 · 64 KB", kind: "file", icon: "X" },
  launchNote: { name: "上线交接备注", source: "launch", body: "明早上线前一起过一遍值班安排，交接表我放群里了。", kind: "note" },
  launchFile: { name: "上线值班交接.pdf", source: "launch", body: "本地已下载 · 192 KB", kind: "file", icon: "P" },
};
const rank = { conflict: 0, choose: 1, source: 1, missing: 2, query: 3, failed: 4 };
const stateLabels = { choose: "待归档", source: "待迁来源", query: "查询未完成", failed: "写入失败" };
const sourceMime = "application/x-snapstow-source";
const lineMime = "application/x-snapstow-connection";
const copying = new Map();
const sourceCaptures = new Map();
const historicalCaptures = ["old", "new", "review", "feedback", "query", "failed"];
const captureStyles = [
  "display", "box-sizing", "width", "height", "min-width", "min-height", "max-width",
  "margin", "padding", "border", "border-radius", "background-color",
  "color", "font-family", "font-size", "font-weight", "font-style", "line-height",
  "letter-spacing", "text-align", "white-space", "overflow-wrap",
  "align-content", "align-items", "justify-content", "justify-items", "flex", "gap",
];

let projects, assignment, records, pending, merged, conflict;
let root, shortcut, channel, queuePage, boxPage, selected, viewing, sourceSelection, composing;
let chatOrder, clientRooms, chatOffset, folderView;
let chatDrag = null;
let lensMode = false;
let settingsOpen = false;
let listening = false;
let chatOpen = true;
let running = true;
let captureActive = false;
let captureDrag = null;
let beltDrag = null;
let fileDrag = null;
let doorDrag = null;
let doorTimer;
let suppressDoorClick = false;
let suppressMessageClick = false;
let previousFocus;
let previewTarget;
let openTimer;
let lastQueueSize;

function resetState() {
  for (const task of copying.values()) clearTimeout(task.timer);
  clearTimeout(openTimer);
  copying.clear();
  sourceCaptures.clear();
  for (const key of historicalCaptures) sourceCaptures.set(key, { src: "./art/source/" + key + ".png" });
  projects = new Map([["pay", "支付改版"], ["sync", "支付联调"], ["launch", "上线准备"], ["handoff", "运维交接"]]);
  assignment = new Map([["dev", "pay"], ["feedback", "pay"], ["launch", "launch"]]);
  records = new Map([["old", { project: "pay", name: fixtures.old.name }], ["feedback", { project: "pay", name: fixtures.feedback.name }]]);
  pending = new Map([["old", "conflict"], ["new", "conflict"], ["review", "choose"], ["query", "query"], ["failed", "failed"]]);
  merged = new Map();
  conflict = { linked: "old", target: "pay" };
  root = "D:\\项目仓库";
  shortcut = "Alt+Shift+S";
  channel = "dev";
  chatOrder = Object.keys(clients);
  clientRooms = new Map(chatOrder.map((client) => [client, clients[client].groups[0]]));
  chatOffset = { x: 0, y: 0 };
  chatStack.style.removeProperty("translate");
  queuePage = boxPage = 0;
  selected = viewing = sourceSelection = null;
  composing = Object.fromEntries(Object.keys(channels).map((key) => [key, []]));
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function art(name, className) {
  const image = node("img", className);
  image.src = "./art/" + name + ".svg";
  image.alt = "";
  image.draggable = false;
  return image;
}

function announce(text = "") {
  byId("status").textContent = text;
}

function sourceOf(key) {
  return key.startsWith("source:") ? key.split(":")[1] : fixtures[key].source;
}

function recordNames(project) {
  return [...records].filter(([, entry]) => entry.project === project).map(([key, entry]) => [key, entry.name]);
}

function chatMessage(key) {
  const item = fixtures[key];
  const button = node("button", "message " + item.kind);
  button.type = "button";
  button.dataset.item = key;
  button.title = "圈选" + (item.kind === "note" ? "这条备注" : item.name);
  if (item.kind !== "environment") button.setAttribute("aria-label", button.title);
  if (item.icon) {
    const icon = node("i", "material-icon " + item.kind, item.icon);
    icon.setAttribute("aria-hidden", "true");
    const description = node("span");
    description.append(node("strong", "", item.name), node("small", "", item.body));
    button.append(icon, description);
  } else {
    button.append(node("span", "chat-text", item.body));
  }
  return button;
}

function filterChatRooms() {
  const profile = clients[chatOrder[0]];
  const query = threadSearch.value.trim().toLocaleLowerCase();
  let matches = 0;
  for (const button of chat.querySelectorAll("[data-channel]")) {
    const room = button.dataset.channel;
    const last = composing[room].at(-1) || sampleReplies[room] || fixtures[channels[room].at(-1)].name;
    button.hidden = !profile.groups.includes(room) || !names[room].toLocaleLowerCase().includes(query);
    button.querySelector("small").textContent = last;
    button.setAttribute("aria-pressed", String(room === channel));
    if (!button.hidden) matches++;
  }
  byId("threads-empty").hidden = matches > 0;
}

function showChatDetail(mode) {
  chatDetail.hidden = !mode;
  chatDetail.dataset.mode = mode || "";
  for (const control of chat.querySelectorAll('[aria-controls="chat-detail"]')) {
    control.setAttribute("aria-expanded", String(control.dataset.chatAction === mode));
  }
  if (!mode) return;
  const list = byId("chat-detail-list");
  list.replaceChildren();
  if (mode === "members") {
    const { members } = clients[chatOrder[0]];
    byId("chat-detail-title").textContent = "群成员 · " + members.length;
    for (const name of members) {
      const entry = node("li");
      const avatar = node("span", "avatar", name[0]);
      avatar.setAttribute("aria-hidden", "true");
      entry.append(avatar, node("span", "", name));
      list.append(entry);
    }
  } else {
    byId("chat-detail-title").textContent = "群文件";
    for (const key of channels[channel]) {
      if (!fixtures[key].icon) continue;
      const entry = node("li");
      const button = node("button", "chat-command", fixtures[key].name);
      button.type = "button";
      button.dataset.jumpMessage = key;
      entry.append(button);
      list.append(entry);
    }
  }
}

function renderChat() {
  const client = chatOrder[0];
  const profile = clients[client];
  chat.dataset.client = client;
  byId("chat-client").textContent = profile.title;
  byId("sender-name").textContent = profile.sender;
  byId("sender-avatar").textContent = profile.sender[0];
  byId("chat-title").textContent = names[channel];
  byId("chat-meta").textContent = profile.workspace;
  byId("chat-meta").hidden = !profile.workspace;
  byId("threads-heading").textContent = profile.heading;
  byId("chat-notice").hidden = client !== "dingtalk";
  byId("chat-notice").open = false;
  filterChatRooms();
  for (const tab of chatStack.querySelectorAll(".chat-back")) {
    const depth = chatOrder.indexOf(tab.dataset.client);
    tab.hidden = depth === 0;
    tab.style.setProperty("--depth", depth);
  }
  messageItems.replaceChildren(...channels[channel].map(chatMessage));
  messages.querySelectorAll(".sent").forEach((item) => item.remove());
  if (sampleReplies[channel]) messages.insertBefore(node("p", "sent", sampleReplies[channel]), selection);
  for (const line of composing[channel]) messages.insertBefore(node("p", "sent", line), selection);
  messages.scrollTop = 0;
  showChatDetail(client === "wecom" && chatStack.clientWidth >= 520 ? "members" : null);
}

function moveChat(x, y) {
  const narrow = screen.clientWidth <= 740;
  const baseLeft = chatStack.offsetLeft;
  const baseTop = chatStack.offsetTop;
  const fan = Math.max(23, Math.min(40, screen.clientWidth * .031));
  const left = narrow ? 5 : Math.min(baseLeft, fan * 2 + 5);
  const top = narrow ? 172 : 14;
  chatOffset = {
    x: Math.max(left - baseLeft, Math.min(screen.clientWidth - baseLeft - chatStack.offsetWidth - 5, x)),
    y: Math.max(Math.min(top, baseTop) - baseTop, Math.min(screen.clientHeight - baseTop - chatStack.offsetHeight - 5, y)),
  };
  chatStack.style.translate = chatOffset.x + "px " + chatOffset.y + "px";
}

function endChatDrag() {
  const pointer = chatDrag?.pointer;
  chatDrag = null;
  chatStack.classList.remove("dragging");
  const titleBar = chatHandle.parentElement;
  if (pointer !== undefined && titleBar.hasPointerCapture(pointer)) titleBar.releasePointerCapture(pointer);
}

function showChat(open) {
  chatOpen = open;
  if (!open) {
    stopCapture();
    endChatDrag();
  }
  chatStack.hidden = !open;
  if (open) moveChat(chatOffset.x, chatOffset.y);
  byId("chat-app").setAttribute("aria-pressed", String(open));
}

function startCapture() {
  if (!running || !bench.hidden || folder.open) return;
  if (!chatOpen) showChat(true);
  if (screen.clientWidth <= 1030 && !chatDetail.hidden) showChatDetail(null);
  captureActive = true;
  chat.classList.add("is-capturing");
  capture.setAttribute("aria-pressed", "true");
  capture.title = "退出圈选 · Esc";
  desktopCue.textContent = "拖框圈住要收的消息。";
  messages.scrollTop = 0;
}

function stopCapture() {
  const pointer = captureDrag?.pointer;
  captureDrag = null;
  captureActive = false;
  if (pointer !== undefined && messages.hasPointerCapture(pointer)) messages.releasePointerCapture(pointer);
  selection.hidden = true;
  chat.classList.remove("is-capturing");
  capture.setAttribute("aria-pressed", "false");
  capture.title = "圈选 · " + shortcut;
  if (desktopCue.textContent !== desktopTagline) desktopCue.textContent = desktopTagline;
}

async function screenshotChat(rect) {
  // Freeze the demo chat and clip it to the selected rectangle inside an image.
  const content = messages.cloneNode(true);
  content.querySelector("#selection").remove();
  const originals = [messages, ...messages.querySelectorAll(":not(#selection, #selection *)")];
  const copies = [content, ...content.querySelectorAll("*")];
  for (const [index, copy] of copies.entries()) {
    const style = getComputedStyle(originals[index]);
    for (const property of captureStyles) copy.style.setProperty(property, style.getPropertyValue(property));
  }
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  Object.assign(content.style, {
    position: "absolute",
    left: -rect.left + "px",
    top: -(rect.top + messages.scrollTop) + "px",
    width: messages.clientWidth + "px",
    height: messages.scrollHeight + "px",
  });
  const markup = new XMLSerializer().serializeToString(content);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height
    + '"><foreignObject width="' + width + '" height="' + height + '">' + markup + '</foreignObject></svg>';
  const bitmap = new Image();
  bitmap.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await bitmap.decode();
  const canvas = node("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  return canvas.toDataURL("image/png");
}

function chatItemBounds(item) {
  const area = messages.getBoundingClientRect();
  const card = item.getBoundingClientRect();
  const left = Math.max(0, card.left - area.left - 6);
  const top = Math.max(0, card.top - area.top - 6);
  return {
    left,
    top,
    width: Math.min(messages.clientWidth, card.right - area.left + 6) - left,
    height: Math.min(messages.clientHeight, card.bottom - area.top + 6) - top,
  };
}

function captureItems(keys, rect) {
  stopCapture();
  const eligible = keys.flatMap((item) => fixtures[item].includes || [item])
    .filter((key) => !records.has(key) && !copying.has(key));
  if (!eligible.length) return;
  const screenshot = { src: "", loading: true };
  screenshotChat(rect).then((src) => {
    screenshot.src = src;
  }).catch(() => {
    screenshot.src = "";
  }).finally(() => {
    screenshot.loading = false;
    if (previewTarget && sourceCaptures.get(previewTarget.dataset.pending || previewTarget.dataset.archived) === screenshot) {
      showPreview(previewTarget);
    }
  });
  for (const key of eligible) {
    sourceCaptures.set(key, screenshot);
    const item = fixtures[key];
    const project = assignment.get(item.source);
    if (item.kind === "missing") pending.set(key, "missing");
    else if (!project) pending.set(key, "choose");
    else if (item.kind === "file") beginCopy(key, project);
    else records.set(key, { project, name: item.name });
  }
}

function point(event) {
  const bounds = messages.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
  };
}

function rectangle(to) {
  const from = captureDrag.origin;
  return {
    left: Math.min(from.x, to.x),
    top: Math.min(from.y, to.y),
    width: Math.abs(from.x - to.x),
    height: Math.abs(from.y - to.y),
  };
}

function covered(rect) {
  const bounds = messages.getBoundingClientRect();
  return [...messageItems.children].filter((item) => {
    const card = item.getBoundingClientRect();
    const horizontal = Math.min(bounds.left + rect.left + rect.width, card.right) - Math.max(bounds.left + rect.left, card.left);
    const vertical = Math.min(bounds.top + rect.top + rect.height, card.bottom) - Math.max(bounds.top + rect.top, card.top);
    return Math.max(horizontal, 0) * Math.max(vertical, 0) >= card.width * card.height * .16;
  }).map((item) => item.dataset.item);
}

function pageSize() {
  return Number(getComputedStyle(queue).getPropertyValue("--queue-size"));
}

function labelFor(key) {
  return key.startsWith("source:") ? names[sourceOf(key)] : fixtures[key].name;
}

function canDiscard(key) {
  return pending.has(key) && pending.get(key) !== "source";
}

function canPlace(key) {
  return ["source", "choose", "conflict"].includes(pending.get(key));
}

function fileCard(key, state, inArchive = false) {
  const button = node("button", "file-card");
  button.type = "button";
  button.dataset[inArchive ? "archived" : "pending"] = key;
  const name = inArchive ? records.get(key)?.name || copying.get(key)?.name || fixtures[key].name : labelFor(key);
  button.append(art(state === "source" ? "checklist" : "paper"), node("strong", "", name));
  let singleState = stateLabels[state];
  if (state === "missing") {
    button.append(art("download-missing", "missing-mark"));
    singleState = "未下载或本地未找到";
  } else if (singleState) {
    const neutral = state === "choose" || state === "source";
    button.append(node("span", neutral ? "file-state neutral" : "file-state", singleState));
  }
  if (!inArchive) {
    if (canPlace(key)) button.setAttribute("aria-pressed", String(selected === key));
    if (canDiscard(key)) button.setAttribute("aria-keyshortcuts", "Delete");
  }
  if (key === "old" && state === "conflict") singleState = "同名冲突，已有归档";
  if (key === "new" && state === "conflict") singleState = "同名冲突，新收到";
  if (state === "copying") {
    singleState = "正在复制";
    button.append(node("span", "file-state neutral", singleState));
  }
  if (state === "history") singleState = "历史副本";
  const description = singleState ? name + " · " + singleState : name;
  button.setAttribute("aria-label", description);
  button.title = description;
  return button;
}

const queueFeatures = [
  ["圈选群聊资料", null],
  ["按项目收好", "parcel"],
  ["开箱回看来源", "checklist"],
];

function queueFeature(index) {
  const [label, asset] = queueFeatures[index];
  const tile = node("div", "file-card feature-card");
  const icon = asset ? art(asset) : node("i", "capture-glyph");
  icon.setAttribute("aria-hidden", "true");
  tile.append(icon, node("strong", "", label));
  return tile;
}

function renderQueue() {
  const focus = document.activeElement?.dataset.pending;
  const size = pageSize();
  lastQueueSize = size;
  const keys = [...pending.keys()].sort((a, b) => rank[pending.get(a)] - rank[pending.get(b)]);
  const last = Math.max(0, Math.ceil(keys.length / size) - 1);
  queuePage = Math.min(queuePage, last);
  const page = keys.slice(queuePage * size, (queuePage + 1) * size);
  queue.replaceChildren(
    ...page.map((key) => fileCard(key, pending.get(key))),
    ...queueFeatures.slice(0, size - page.length).map((_, index) => queueFeature(index))
  );
  byId("queue-prev").disabled = queuePage === 0;
  byId("queue-next").disabled = queuePage === last;
  if (focus) queue.querySelector('[data-pending="' + focus + '"]')?.focus({ preventScroll: true });
  syncLine();
}

function renderBoxes() {
  const focus = document.activeElement?.dataset.project;
  const keys = [...projects.keys()];
  boxes.replaceChildren();
  for (const key of keys.slice(boxPage * 2, boxPage * 2 + 2)) {
    const box = node("button", "project");
    box.type = "button";
    box.dataset.project = key;
    box.title = projects.get(key);
    const name = projects.get(key);
    const action = selected ? "归档到" : "打开";
    box.setAttribute("aria-label", action + name + "项目箱");
    box.append(art("parcel-glow", "parcel-glow"), art("parcel", "parcel"), art("parcel-label", "parcel-label"), node("strong", "", name));
    boxes.append(box);
  }
  syncCopyBadges();
  if (focus) boxes.querySelector('[data-project="' + focus + '"]')?.focus({ preventScroll: true });
  syncLine();
}

function syncCopyBadges() {
  const active = new Set([...copying.values()].map((task) => task.project));
  for (const box of boxes.querySelectorAll("[data-project]")) {
    box.toggleAttribute("data-copying", active.has(box.dataset.project));
  }
}

function syncLine() {
  const line = byId("association");
  const movingFile = conflict?.linked === fileDrag?.key && fileDrag?.ghost;
  const from = movingFile || (conflict?.linked && queue.querySelector('[data-pending="' + conflict.linked + '"]'));
  const to = conflict && boxes.querySelector('[data-project="' + conflict.target + '"]');
  const visible = Boolean(!bench.hidden && !settingsOpen && !archive.open && from && to);
  line.hidden = !visible;
  cut.hidden = !visible || Boolean(movingFile);
  if (!visible) return;
  const boardRect = board.getBoundingClientRect();
  const origin = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();
  const x = origin.left + origin.width / 2 - boardRect.left;
  const y = (movingFile && origin.top > end.top ? origin.top : origin.bottom) - boardRect.top;
  const dx = end.left + end.width / 2 - boardRect.left - x;
  const dy = end.top - boardRect.top - y;
  line.style.setProperty("--x", x + "px");
  line.style.setProperty("--y", y + "px");
  line.style.setProperty("--length", Math.max(1, Math.hypot(dx, dy) - 4) + "px");
  line.style.setProperty("--angle", Math.atan2(dy, dx) + "rad");
  cut.style.setProperty("--cut-x", x + dx * .33 + "px");
  cut.style.setProperty("--cut-y", y + dy * .33 + "px");
}

function renderBench() {
  if (bench.hidden) return;
  renderQueue();
  renderBoxes();
  if (archive.open) renderArchive();
}

function showBench(open) {
  if (!running) return;
  closeTray();
  if (!open) {
    closeArchive(false);
    if (lensMode) setLens(false);
    clearFileDrag();
    resetWarehouseDoor();
  }
  stopCapture();
  bench.hidden = !open;
  tray.setAttribute("aria-expanded", String(open));
  endChatDrag();
  chatStack.inert = open;
  desktopGuide.inert = open;
  if (open) {
    renderBench();
    byId("bench-home").focus({ preventScroll: true });
  } else {
    clearTimeout(openTimer);
    showPreview();
    announce();
    tray.focus({ preventScroll: true });
  }
}

function beginCopy(key, project, name = fixtures[key].name) {
  if (copying.has(key)) return;
  const wasPending = pending.delete(key);
  const task = { project, name };
  task.timer = setTimeout(() => {
    copying.delete(key);
    records.set(key, { project: task.project, name: task.name });
    if (!bench.hidden) {
      syncCopyBadges();
      if (archive.open && viewing === task.project) renderArchive();
    }
  }, 620);
  copying.set(key, task);
  if (!bench.hidden) {
    if (wasPending) renderQueue();
    syncCopyBadges();
    if (archive.open && viewing === project) renderArchive();
  }
}

function newName(key, project) {
  const original = fixtures[key].name;
  const used = new Set(recordNames(project).map(([, name]) => name));
  for (const task of copying.values()) if (task.project === project) used.add(task.name);
  if (!used.has(original)) return original;
  const dot = original.lastIndexOf(".");
  const base = dot < 0 ? original : original.slice(0, dot);
  const ext = dot < 0 ? "" : original.slice(dot);
  let version = 2;
  while (used.has(base + " (" + version + ")" + ext)) version++;
  return base + " (" + version + ")" + ext;
}

function place(key, project) {
  const state = pending.get(key);
  if (!canPlace(key)) return;
  let operation = null;
  if (state === "source") {
    const source = sourceOf(key);
    for (const [file, entry] of records) {
      if (sourceOf(file) === source && entry.project !== project) {
        entry.name = newName(file, project);
        entry.project = project;
      }
    }
    for (const [file, task] of copying) {
      if (sourceOf(file) === source && task.project !== project) {
        task.name = newName(file, project);
        task.project = project;
      }
    }
    merged.delete(source);
    assignment.set(source, project);
    pending.delete(key);
  } else if (state === "conflict") {
    const previous = records.get("old");
    const replace = key === "new" && (!conflict?.linked || conflict.linked === "new") && previous?.project === project;
    pending.delete("old");
    pending.delete("new");
    conflict = null;
    if (key === "new" || previous?.project !== project) {
      if (replace) records.set("old", { ...previous, historical: true });
      operation = [key, project, replace ? previous.name : newName(key, project)];
    }
  } else {
    const source = sourceOf(key);
    if (!assignment.has(source)) assignment.set(source, project);
    operation = [key, project, newName(key, project)];
  }
  selected = null;
  if (operation) beginCopy(...operation);
  renderBench();
  announce();
  boxes.querySelector('[data-project="' + project + '"]')?.focus({ preventScroll: true });
}

function discard(key) {
  if (!canDiscard(key)) return;
  const focused = document.activeElement?.dataset.pending === key;
  if (pending.get(key) === "conflict") {
    if (key === "new") pending.delete("old");
    else if (pending.has("new")) pending.set("new", "choose");
    conflict = null;
    selected = null;
  }
  pending.delete(key);
  if (!records.has(key)) sourceCaptures.delete(key);
  if (selected === key) selected = null;
  renderBench();
  if (focused) (queue.querySelector("button") || byId("bench-home")).focus({ preventScroll: true });
  announce("已移除 " + labelFor(key));
}

function changeQueue(direction) {
  const trigger = document.activeElement;
  queuePage += direction;
  selected = null;
  renderQueue();
  renderBoxes();
  if (trigger?.disabled) byId(direction > 0 ? "queue-prev" : "queue-next").focus({ preventScroll: true });
  showPreview();
}

function changeBoxes(direction) {
  const next = Math.max(0, Math.min(Math.ceil(projects.size / 2) - 1, boxPage + direction));
  if (boxPage === next) return;
  boxPage = next;
  renderBoxes();
  showPreview();
}

function renderArchive() {
  if (!viewing) return;
  byId("archive-title").textContent = projects.get(viewing);
  const offset = archiveContent.scrollTop;
  const focused = document.activeElement?.dataset;
  archiveContent.replaceChildren();
  const groups = new Map();
  const addFile = (key, state) => {
    const source = sourceOf(key);
    if (pending.has("source:" + source)) return;
    const group = merged.get(source) || source;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ key, state, source });
  };
  for (const [key, entry] of records) if (entry.project === viewing) addFile(key, entry.historical ? "history" : "saved");
  for (const [key, task] of copying) if (task.project === viewing) addFile(key, "copying");

  for (const [source, files] of groups) {
    const section = node("section", "group");
    const card = node("button", "group-card");
    card.type = "button";
    card.dataset.source = source;
    card.draggable = true;
    card.title = names[source];
    card.setAttribute("aria-pressed", String(sourceSelection === source));
    card.append(art("checklist"), node("strong", "", names[source]));
    const origins = [...new Set(files.map((entry) => entry.source))];
    if (origins.length > 1) card.append(node("small", "group-sources", origins.map((key) => names[key]).join("、")));
    section.append(card);

    const actions = node("div", "group-actions");
    const move = node("button", "icon-control group-move");
    move.type = "button";
    move.dataset.moveSource = source;
    move.setAttribute("aria-label", "移出" + names[source]);
    move.title = "移出来源";
    const arrow = node("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    move.append(arrow);
    actions.append(move);
    section.append(actions);

    const list = node("ul", "group-files");
    for (const entry of files) {
      const row = node("li");
      row.append(fileCard(entry.key, entry.state, true));
      list.append(row);
    }
    section.append(list);
    archiveContent.append(section);
  }
  archiveContent.scrollTop = offset;
  if (focused?.archived) archiveContent.querySelector('[data-archived="' + focused.archived + '"]')?.focus({ preventScroll: true });
  if (focused?.source) archiveContent.querySelector('[data-source="' + focused.source + '"]')?.focus({ preventScroll: true });
}

function openArchive(project, trigger) {
  clearTimeout(openTimer);
  if (archive.open) return;
  previousFocus = trigger;
  viewing = project;
  sourceSelection = null;
  setLens(false);
  renderArchive();
  board.inert = true;
  byId("lens").hidden = byId("settings").hidden = true;
  underlay.hidden = false;
  archive.show();
  syncLine();
}

function moveSource(key) {
  if (!viewing) return;
  const group = [key, ...[...merged].filter(([, target]) => target === key).map(([source]) => source)];
  for (const source of group) pending.set("source:" + source, "source");
  queuePage = 0;
  closeArchive(false);
  renderQueue();
  announce(names[key] + "已移到待处理区");
}

function mergeSources(source, target) {
  if (source === target) return;
  for (const [key, value] of merged) if (value === source) merged.set(key, target);
  merged.set(source, target);
  sourceSelection = null;
  renderArchive();
  archiveContent.querySelector('[data-source="' + target + '"]')?.focus({ preventScroll: true });
}

function setLens(enabled) {
  lensMode = enabled;
  bench.classList.toggle("lens-on", enabled);
  byId("lens").setAttribute("aria-pressed", String(enabled && !archive.open));
  byId("archive-lens").setAttribute("aria-pressed", String(enabled && archive.open));
  showPreview();
}

function showPreview(target) {
  const anchorChanged = target !== previewTarget;
  previewTarget = undefined;
  preview.hidden = true;
  if (!lensMode || !target?.isConnected) {
    preview.replaceChildren();
    return;
  }
  const key = target.dataset.pending || target.dataset.archived;
  let title;
  let text;
  const sourceCapture = sourceCaptures.get(key);
  if (key) {
    title = records.get(key)?.name || labelFor(key);
    text = names[sourceOf(key)] + (key.startsWith("source:") ? " · 待迁来源" : "");
  } else if (target.dataset.source) {
    title = names[target.dataset.source];
    text = "示例会话来源";
  } else if (target.dataset.project) {
    title = projects.get(target.dataset.project);
    text = "创建于 2026-11-20 · " + recordNames(target.dataset.project).length + " 项资料 · 0 个子目录";
  }
  if (!title) return;
  previewTarget = target;
  preview.classList.toggle("has-screenshot", Boolean(sourceCapture?.src));
  const description = node("div", "preview-description");
  description.append(node("strong", "", title), node("span", "", text));
  preview.replaceChildren(description);
  if (sourceCapture?.src) {
    const frame = node("figure", "source-image");
    const image = node("img");
    image.alt = title + "的圈选来源截图";
    image.addEventListener("load", () => { if (previewTarget === target) positionPreview(target); }, { once: true });
    image.addEventListener("error", () => {
      if (previewTarget !== target || !frame.isConnected) return;
      frame.remove();
      description.append(node("span", "", "没有可预览的来源截图"));
      preview.classList.remove("has-screenshot");
      positionPreview(target);
    }, { once: true });
    image.src = sourceCapture.src;
    frame.append(image);
    preview.prepend(frame);
  } else if (fixtures[key]) {
    description.append(node("span", "", sourceCapture?.loading ? "正在准备来源截图…" : "没有可预览的来源截图"));
  }
  preview.hidden = false;
  positionPreview(target);
  if (anchorChanged && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    preview.getAnimations().forEach((animation) => animation.cancel());
    preview.animate([{ opacity: 0, scale: ".93" }, { opacity: 1, scale: "1" }], { duration: 125, easing: "ease-out" });
  }
}

function positionPreview(target) {
  const frame = byId("bench-main").getBoundingClientRect();
  const card = target.getBoundingClientRect();
  const margin = 8;
  const gap = 9;
  const x = card.left - frame.left;
  const y = card.top - frame.top;
  const centerX = x + card.width / 2;
  const centerY = y + card.height / 2;
  const leftSpace = x - gap - margin;
  const rightSpace = frame.width - x - card.width - gap - margin;
  const topSpace = y - gap - margin;
  const bottomSpace = frame.height - y - card.height - gap - margin;
  const idealWidth = preview.classList.contains("has-screenshot") ? 340 : 238;
  const beside = Math.max(leftSpace, rightSpace) >= Math.min(220, idealWidth);
  const side = beside
    ? (rightSpace >= leftSpace ? "right" : "left")
    : (bottomSpace >= topSpace ? "bottom" : "top");
  const availableWidth = beside ? Math.max(leftSpace, rightSpace) : frame.width - 2 * margin;
  const availableHeight = beside ? frame.height - 2 * margin : Math.max(topSpace, bottomSpace);
  preview.dataset.side = side;
  preview.style.setProperty("--preview-width", Math.min(idealWidth, availableWidth) + "px");
  preview.style.setProperty("--photo-height", Math.max(40, Math.min(220, availableHeight - 65)) + "px");
  const width = preview.offsetWidth;
  const height = preview.offsetHeight;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const left = beside
    ? (side === "right" ? x + card.width + gap : x - width - gap)
    : clamp(centerX - width / 2, margin, frame.width - width - margin);
  const top = beside
    ? clamp(centerY - height / 2, margin, frame.height - height - margin)
    : (side === "bottom" ? y + card.height + gap : y - height - gap);
  const tip = beside ? clamp(centerY - top, 12, height - 12) : clamp(centerX - left, 12, width - 12);
  preview.style.left = left + "px";
  preview.style.top = top + "px";
  preview.style.setProperty("--tip", tip + "px");
}

function resetWarehouseDoor() {
  clearTimeout(doorTimer);
  doorTimer = undefined;
  doorDrag = null;
  warehouseDoor.classList.remove("rolling");
  warehouseDoor.style.removeProperty("--door-lift");
}

function updateWarehouseDirectory() {
  byId("root-label").textContent = root || "工作总目录";
  byId("root-picker").title = root || "选择工作总目录";
}

function showSettings(open) {
  if (archive.open) return;
  if (open) {
    clearFileDrag();
    announce();
  }
  resetWarehouseDoor();
  settingsOpen = open;
  listening = false;
  setLens(false);
  board.hidden = open;
  byId("settings-page").hidden = !open;
  byId("settings").setAttribute("aria-pressed", String(open));
  byId("lens").disabled = open;
  updateWarehouseDirectory();
  byId("shortcut").textContent = shortcut.replaceAll("+", " + ");
  syncLine();
}

const computer = "此电脑";
const localDrive = "D:\\";
const teamDrive = "E:\\";
const demoDirectories = new Map([
  [computer, [localDrive, teamDrive]],
  [localDrive, ["D:\\项目仓库", "D:\\工作"]],
  ["D:\\工作", ["D:\\工作\\归档"]],
  [teamDrive, ["E:\\团队资料"]],
]);

function directoryPath(parent, name) {
  return parent + (parent.endsWith("\\") ? "" : "\\") + name;
}

function parentDirectory(path) {
  if (path === computer) return null;
  if (path.length === 3) return computer;
  return path.slice(0, Math.max(3, path.lastIndexOf("\\")));
}

function directoryName(path) {
  if (path === computer) return computer;
  if (path === localDrive) return "本地磁盘 (D:)";
  if (path === teamDrive) return "团队盘 (E:)";
  return path.slice(path.lastIndexOf("\\") + 1);
}

function folderLink(path, text, className) {
  const button = node("button", className, text);
  button.type = "button";
  button.dataset.path = path;
  if (path === folderView.path) button.setAttribute("aria-current", "location");
  return button;
}

function folderRow(name, path) {
  const row = node("li");
  const entry = path ? folderLink(path, "", "explorer-row") : node("div", "explorer-row");
  const label = node("span", "entry-name");
  const icon = node("i", path ? "folder-mark" : "file-mark");
  icon.setAttribute("aria-hidden", "true");
  label.append(icon, node("span", "", name));
  entry.append(label, node("small", "", path ? (parentDirectory(path) === computer ? "磁盘" : "文件夹") : "文件"));
  row.append(entry);
  return row;
}

function renderFolder() {
  const { path, history, choose } = folderView;
  const trail = [];
  for (let part = path; part; part = parentDirectory(part)) trail.unshift(part);
  const address = byId("explorer-path");
  address.replaceChildren(...trail.map((part) => folderLink(part, directoryName(part))));
  address.scrollLeft = address.scrollWidth;
  const places = [...new Set([computer, localDrive, teamDrive, root].filter(Boolean))];
  byId("explorer-places").replaceChildren(...places.map((place) => folderLink(place, directoryName(place))));

  const projectPaths = new Map([...projects].map(([key, name]) => [directoryPath(root, name), key]));
  const children = [...new Set([...(demoDirectories.get(path) || []), ...(path === root ? projectPaths.keys() : [])])];
  const rows = children.map((child) => folderRow(directoryName(child), child));
  const project = projectPaths.get(path);
  if (project && !choose) {
    for (const [key, name] of recordNames(project)) {
      if (!records.get(key).historical) rows.push(folderRow(name));
    }
  }
  if (!rows.length) rows.push(node("li", "explorer-empty", "空文件夹"));
  byId("explorer-list").replaceChildren(...rows);
  byId("explorer-back").disabled = history.length === 0;
  byId("explorer-up").disabled = !parentDirectory(path);
  byId("explorer-location").textContent = path;
  directoryButton.disabled = path === computer;
}

function navigateFolder(path) {
  if (!path || path === folderView.path) return;
  folderView.history.push(folderView.path);
  folderView.path = path;
  renderFolder();
}

function showFolder(path, choose, opener) {
  if (folder.open) return;
  folderView = { path, choose, history: [] };
  byId("explorer-caption").textContent = choose ? "选择工作总目录" : "文件资源管理器";
  byId("explorer-cancel").textContent = choose ? "取消" : "关闭";
  directoryButton.hidden = !choose;
  renderFolder();
  opener.focus({ preventScroll: true });
  folder.showModal();
  const address = byId("explorer-path");
  address.scrollLeft = address.scrollWidth;
  address.lastElementChild.focus({ preventScroll: true });
}

function openFolder(project, opener = tray) {
  closeTray();
  if (!root) return;
  const path = project ? directoryPath(root, projects.get(project)) : root;
  showFolder(path, false, opener);
}

function openTray() {
  trayMenu.querySelector("span").textContent = shortcut.replaceAll("+", " + ");
  byId("tray-root").disabled = !root;
  trayMenu.hidden = false;
  byId("tray-shortcut").focus({ preventScroll: true });
}

function closeTray() {
  trayMenu.hidden = true;
}

function renameProject(box) {
  clearTimeout(openTimer);
  if (boxes.querySelector(".rename")) return;
  const project = box.dataset.project;
  const name = projects.get(project);
  const input = node("input", "rename");
  input.value = name;
  input.maxLength = 36;
  input.setAttribute("aria-label", "重命名" + name);
  const wrapper = node("div", "rename-wrapper");
  const rect = box.getBoundingClientRect();
  const deck = boxes.getBoundingClientRect();
  wrapper.style.left = rect.left - deck.left + "px";
  wrapper.style.top = rect.top - deck.top + rect.height * .54 + "px";
  wrapper.style.width = rect.width + "px";
  wrapper.append(input);
  boxes.append(wrapper);
  input.focus();
  input.select();
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      wrapper.remove();
      box.focus();
    } else if (event.key === "Enter") {
      const value = input.value.trim();
      if (!value || [...projects].some(([key, label]) => key !== project && label === value)) {
        announce("请输入一个未使用的项目名");
        return;
      }
      projects.set(project, value);
      wrapper.remove();
      renderBoxes();
      announce();
      boxes.querySelector('[data-project="' + project + '"]').focus();
    }
  });
  input.addEventListener("blur", () => setTimeout(() => wrapper.remove(), 0), { once: true });
}

function shortcutFrom(event) {
  if (!/^[a-z]$/i.test(event.key) || !(event.ctrlKey || event.altKey || event.metaKey)) return "";
  const keys = [event.ctrlKey && "Control", event.altKey && "Alt", event.shiftKey && "Shift", event.metaKey && "Meta", event.key.toUpperCase()];
  return keys.filter(Boolean).join("+");
}

function setRunning(active) {
  running = active;
  for (const control of [tray, capture, queueExample, archiveExample]) control.disabled = !active;
}

function reset() {
  closeArchive(false);
  if (folder.open) folder.close();
  resetState();
  setRunning(true);
  showBench(false);
  bench.dataset.theme = "dark";
  byId("theme").title = "切换为浅色外观";
  byId("theme").setAttribute("aria-pressed", "false");
  showSettings(false);
  showChat(true);
  chatStack.inert = false;
  capture.setAttribute("aria-keyshortcuts", shortcut);
  byId("reply").value = "";
  threadSearch.value = "";
  renderChat();
}

capture.addEventListener("click", () => captureActive ? stopCapture() : startCapture());
queueExample.addEventListener("click", () => {
  showBench(true);
  showSettings(false);
});
archiveExample.addEventListener("click", () => {
  boxPage = 0;
  showBench(true);
  showSettings(false);
  openArchive("pay", boxes.querySelector('[data-project="pay"]'));
});
chatStack.querySelector(".chat-sides").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-client]");
  if (!tab) return;
  stopCapture();
  clientRooms.set(chatOrder[0], channel);
  const client = tab.dataset.client;
  chatOrder = [client, ...chatOrder.filter((id) => id !== client)];
  channel = clientRooms.get(client);
  threadSearch.value = "";
  renderChat();
  if (event.detail === 0) chatHandle.focus({ preventScroll: true });
});
const chatTitleBar = chatHandle.parentElement;
chatTitleBar.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest("#min-chat")) return;
  chatDrag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, start: chatOffset };
  chatTitleBar.setPointerCapture(event.pointerId);
});
chatTitleBar.addEventListener("pointermove", (event) => {
  if (chatDrag?.pointer !== event.pointerId) return;
  const dx = event.clientX - chatDrag.x;
  const dy = event.clientY - chatDrag.y;
  if (!chatStack.classList.contains("dragging") && Math.hypot(dx, dy) < 5) return;
  chatStack.classList.add("dragging");
  moveChat(chatDrag.start.x + dx, chatDrag.start.y + dy);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  chatTitleBar.addEventListener(type, (event) => {
    if (chatDrag?.pointer === event.pointerId && (type !== "lostpointercapture" || event.target === chatTitleBar)) endChatDrag();
  });
}
chatHandle.addEventListener("keydown", (event) => {
  const direction = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
  if (!direction) return;
  event.preventDefault();
  moveChat(chatOffset.x + direction[0], chatOffset.y + direction[1]);
});
chat.querySelector(".channels").addEventListener("click", (event) => {
  const button = event.target.closest("[data-channel]");
  if (!button || button.dataset.channel === channel) return;
  stopCapture();
  channel = button.dataset.channel;
  renderChat();
});
threadSearch.addEventListener("input", filterChatRooms);
chat.addEventListener("click", (event) => {
  const action = event.target.closest("[data-chat-action]")?.dataset.chatAction;
  const key = event.target.closest("[data-jump-message]")?.dataset.jumpMessage;
  if (action === "threads") threadSearch.focus();
  else if (action === "close") showChatDetail(null);
  else if (action === "latest") messages.scrollTop = messages.scrollHeight;
  else if (action) showChatDetail(chatDetail.dataset.mode === action ? null : action);
  else if (key) {
    showChatDetail(null);
    const message = messageItems.querySelector('[data-item="' + key + '"]');
    message.scrollIntoView({ block: "nearest" });
    message.focus({ preventScroll: true });
  }
});
byId("chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = byId("reply");
  const text = input.value.trim();
  if (!text) return;
  stopCapture();
  composing[channel].push(text);
  filterChatRooms();
  messages.insertBefore(node("p", "sent", text), selection);
  messages.scrollTop = messages.scrollHeight;
  input.value = "";
  input.focus({ preventScroll: true });
});
messageItems.addEventListener("click", (event) => {
  const item = event.target.closest("[data-item]");
  if (item && !suppressMessageClick && running) captureItems([item.dataset.item], chatItemBounds(item));
});
messages.addEventListener("pointerdown", (event) => {
  if (!captureActive || captureDrag || event.button !== 0) return;
  captureDrag = { pointer: event.pointerId, origin: point(event), scroll: messages.scrollTop };
});
messages.addEventListener("pointermove", (event) => {
  if (captureDrag?.pointer !== event.pointerId) return;
  const rect = rectangle(point(event));
  if (Math.hypot(rect.width, rect.height) < 6) return;
  if (!messages.hasPointerCapture(event.pointerId)) messages.setPointerCapture(event.pointerId);
  selection.hidden = false;
  selection.style.left = rect.left + "px";
  selection.style.top = rect.top + captureDrag.scroll + "px";
  selection.style.width = rect.width + "px";
  selection.style.height = rect.height + "px";
});
messages.addEventListener("pointerup", (event) => {
  if (captureDrag?.pointer !== event.pointerId) return;
  const rect = rectangle(point(event));
  const dragged = messages.hasPointerCapture(event.pointerId) || Math.hypot(rect.width, rect.height) >= 6;
  captureDrag = null;
  if (!dragged && event.target.closest("[data-item]")) return;
  suppressMessageClick = dragged;
  setTimeout(() => { suppressMessageClick = false; }, 0);
  captureItems(covered(rect), rect);
});
messages.addEventListener("lostpointercapture", (event) => {
  if (event.target === messages && captureDrag?.pointer === event.pointerId) stopCapture();
});
messages.addEventListener("pointercancel", stopCapture);

byId("min-chat").addEventListener("click", () => {
  showChat(false);
  byId("chat-app").focus({ preventScroll: true });
});
byId("chat-app").addEventListener("click", () => {
  if (!bench.hidden) showBench(false);
  showChat(true);
  byId("chat-app").focus({ preventScroll: true });
});
tray.addEventListener("click", () => showBench(true));
tray.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (running) openTray();
});
byId("tray-shortcut").addEventListener("click", () => {
  closeTray();
  showBench(true);
  showSettings(true);
  byId("shortcut").focus();
});
byId("tray-root").addEventListener("click", () => openFolder());
byId("tray-exit").addEventListener("click", () => {
  showBench(false);
  closeTray();
  setRunning(false);
  byId("reset").focus({ preventScroll: true });
});
document.addEventListener("pointerdown", (event) => {
  if (!trayMenu.hidden && !trayMenu.contains(event.target) && !tray.contains(event.target)) closeTray();
});

byId("min-bench").addEventListener("click", () => showBench(false));
byId("bench-home").addEventListener("click", () => {
  closeArchive(false);
  showSettings(false);
});
byId("lens").addEventListener("click", () => setLens(!lensMode));
byId("archive-lens").addEventListener("click", () => setLens(!lensMode));
byId("settings").addEventListener("click", () => showSettings(!settingsOpen));
byId("root-picker").addEventListener("click", (event) => showFolder(root || computer, true, event.currentTarget));
folder.addEventListener("click", (event) => {
  const entry = event.target.closest("[data-path]");
  if (!entry || !folder.contains(entry) || entry.dataset.path === folderView.path) return;
  navigateFolder(entry.dataset.path);
  byId("explorer-path").lastElementChild.focus({ preventScroll: true });
});
byId("explorer-up").addEventListener("click", () => navigateFolder(parentDirectory(folderView.path)));
byId("explorer-back").addEventListener("click", () => {
  folderView.path = folderView.history.pop();
  renderFolder();
});
directoryButton.addEventListener("click", () => {
  if (!folderView.choose || folderView.path === computer) return;
  root = folderView.path;
  updateWarehouseDirectory();
  folder.close();
});
byId("shortcut").addEventListener("click", () => {
  listening = true;
  byId("shortcut").textContent = "按下快捷键";
});
function returnFromWarehouse() {
  showSettings(false);
  byId("settings").focus({ preventScroll: true });
}

warehouseDoor.addEventListener("click", (event) => {
  if (!suppressDoorClick || event.detail === 0) returnFromWarehouse();
});
warehouseDoor.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !event.isPrimary || doorTimer) return;
  suppressDoorClick = false;
  doorDrag = { pointer: event.pointerId, y: event.clientY, x: event.clientX };
  warehouseDoor.setPointerCapture(event.pointerId);
});
warehouseDoor.addEventListener("pointermove", (event) => {
  if (doorDrag?.pointer !== event.pointerId) return;
  const rise = doorDrag.y - event.clientY;
  if (Math.hypot(rise, event.clientX - doorDrag.x) >= 6) suppressDoorClick = true;
  warehouseDoor.style.setProperty("--door-lift", -Math.min(warehouseDoor.clientHeight, Math.max(0, rise)) + "px");
});
function finishDoorDrag(event) {
  if (doorDrag?.pointer !== event.pointerId) return;
  const raised = doorDrag.y - event.clientY >= 25;
  doorDrag = null;
  if (event.type !== "pointerup" || !raised) {
    warehouseDoor.style.removeProperty("--door-lift");
    return;
  }
  suppressDoorClick = true;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    returnFromWarehouse();
    return;
  }
  warehouseDoor.classList.add("rolling");
  warehouseDoor.style.setProperty("--door-lift", -warehouseDoor.clientHeight + "px");
  doorTimer = setTimeout(returnFromWarehouse, 240);
}
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
  warehouseDoor.addEventListener(event, finishDoorDrag);
}
byId("theme").addEventListener("click", (event) => {
  const light = bench.dataset.theme !== "light";
  bench.dataset.theme = light ? "light" : "dark";
  event.currentTarget.setAttribute("aria-pressed", String(light));
  event.currentTarget.title = light ? "切换为深色外观" : "切换为浅色外观";
});

byId("queue-next").addEventListener("click", () => changeQueue(1));
byId("queue-prev").addEventListener("click", () => changeQueue(-1));
belt.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !event.isPrimary || beltDrag || fileDrag || event.target.closest("input")) return;
  if (event.pointerType === "mouse" && !event.target.closest("button")) event.preventDefault();
  beltDrag = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
});
belt.addEventListener("pointermove", (event) => {
  if (beltDrag?.pointer !== event.pointerId) return;
  const distance = event.clientX - beltDrag.x;
  if (!belt.classList.contains("swiping")) {
    if (Math.abs(distance) < 6 || Math.abs(distance) < Math.abs(event.clientY - beltDrag.y)) return;
    belt.setPointerCapture(event.pointerId);
    belt.classList.add("swiping");
  }
  const offset = Math.max(-115, Math.min(115, distance));
  belt.style.setProperty("--belt-move", offset + "px");
  syncLine();
});
function endBelt(event, complete) {
  if (beltDrag?.pointer !== event.pointerId) return;
  const offset = event.clientX - beltDrag.x;
  const swiping = belt.classList.contains("swiping");
  beltDrag = null;
  belt.classList.remove("swiping");
  belt.style.removeProperty("--belt-move");
  if (complete && swiping && Math.abs(offset) >= (pageSize() === 2 ? 60 : 96)) changeBoxes(offset < 0 ? 1 : -1);
  syncLine();
}
belt.addEventListener("pointerup", (event) => endBelt(event, true));
belt.addEventListener("pointercancel", (event) => endBelt(event, false));
belt.addEventListener("pointerleave", (event) => {
  if (!belt.hasPointerCapture(event.pointerId)) endBelt(event, false);
});
belt.addEventListener("lostpointercapture", (event) => {
  if (event.target === belt) endBelt(event, false);
});
belt.addEventListener("keydown", (event) => {
  if (event.target !== belt || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  changeBoxes(event.key === "ArrowRight" ? 1 : -1);
});

queue.addEventListener("pointerdown", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card || event.button !== 0 || !event.isPrimary || fileDrag || beltDrag) return;
  const rect = card.getBoundingClientRect();
  fileDrag = { card, key: card.dataset.pending, pointer: event.pointerId, x: event.clientX, y: event.clientY, rect };
});

function updateFileDropTarget(drag, event) {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const project = target?.closest("[data-project]");
  const next = project && canPlace(drag.key) ? project : null;
  if (drag.project !== next) {
    drag.project?.classList.remove("drop-target");
    next?.classList.add("drop-target");
    drag.project = next;
  }
  dropBin.toggleAttribute("data-hit", !dropBin.hidden && target === dropBin);
}

function clearFileDrag() {
  if (!fileDrag) return;
  const followed = conflict?.linked === fileDrag.key && fileDrag.ghost;
  fileDrag.card.classList.remove("drag-origin");
  fileDrag.project?.classList.remove("drop-target");
  fileDrag.ghost?.remove();
  dropBin.hidden = true;
  dropBin.removeAttribute("data-hit");
  fileDrag = null;
  if (followed) syncLine();
}

document.addEventListener("pointermove", (event) => {
  const drag = fileDrag;
  if (drag?.pointer !== event.pointerId) return;
  if (!drag.ghost) {
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    queue.setPointerCapture(event.pointerId);
    drag.ghost = node("div", "file-card drag-ghost");
    drag.ghost.setAttribute("aria-hidden", "true");
    drag.ghost.replaceChildren(...[...drag.card.children].map((child) => child.cloneNode(true)));
    drag.previewWidth = Math.min(pageSize() === 2 ? 90 : 104, drag.rect.width);
    drag.ghost.style.width = drag.previewWidth + "px";
    board.append(drag.ghost);
    drag.previewHeight = drag.ghost.offsetHeight;
    drag.card.classList.add("drag-origin");
    dropBin.hidden = !canDiscard(drag.key);
    showPreview();
  }
  updateFileDropTarget(drag, event);
  const bounds = board.getBoundingClientRect();
  const hit = dropBin.hasAttribute("data-hit") && dropBin.getBoundingClientRect();
  drag.ghost.classList.toggle("over-bin", Boolean(hit));
  const left = hit
    ? hit.left + (hit.width - drag.previewWidth) / 2
    : event.clientX - (drag.x - drag.rect.left) * drag.previewWidth / drag.rect.width;
  const top = hit
    ? hit.top - drag.previewHeight * .32
    : event.clientY - (drag.y - drag.rect.top) * drag.previewHeight / drag.rect.height;
  drag.ghost.style.translate = (left - bounds.left) + "px " + (top - bounds.top) + "px";
  if (conflict?.linked === drag.key) syncLine();
});

document.addEventListener("pointerup", (event) => {
  const drag = fileDrag;
  if (drag?.pointer !== event.pointerId) return;
  if (drag.ghost) updateFileDropTarget(drag, event);
  const remove = dropBin.hasAttribute("data-hit");
  clearFileDrag();
  if (remove) discard(drag.key);
  else if (drag.project) place(drag.key, drag.project.dataset.project);
});

for (const type of ["pointercancel", "lostpointercapture"]) {
  document.addEventListener(type, (event) => {
    if (fileDrag?.pointer !== event.pointerId) return;
    if (event.type === "lostpointercapture" && queue.hasPointerCapture(event.pointerId)) return;
    clearFileDrag();
  });
}

queue.addEventListener("click", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card) return;
  const key = card.dataset.pending;
  const state = pending.get(key);
  if (lensMode || state === "missing") {
    if (state === "missing") announce(labelFor(key) + "尚未下载");
    showPreview(card);
  } else if (state === "query" || state === "failed") {
    beginCopy(key, assignment.get(sourceOf(key)) || "pay");
    (queue.querySelector("button") || byId("bench-home")).focus({ preventScroll: true });
  } else {
    selected = key === selected ? null : key;
    renderQueue();
    renderBoxes();
    queue.querySelector('[data-pending="' + key + '"]')?.focus({ preventScroll: true });
  }
});
queue.addEventListener("keydown", (event) => {
  const card = event.target.closest("[data-pending]");
  if (event.key !== "Delete" || event.repeat || !card || !canDiscard(card.dataset.pending)) return;
  event.preventDefault();
  discard(card.dataset.pending);
});
queue.addEventListener("dragover", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card || pending.get(card.dataset.pending) !== "conflict" || !event.dataTransfer.types.includes(lineMime)) return;
  event.preventDefault();
  card.classList.add("relink-target");
});
queue.addEventListener("dragleave", (event) => event.target.closest("[data-pending]")?.classList.remove("relink-target"));
queue.addEventListener("drop", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card || pending.get(card.dataset.pending) !== "conflict" || !event.dataTransfer.getData(lineMime)) return;
  event.preventDefault();
  conflict.linked = card.dataset.pending;
  renderQueue();
});
cut.addEventListener("dragstart", (event) => {
  if (!conflict?.linked) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(lineMime, conflict.linked);
});
cut.addEventListener("click", () => {
  if (!conflict) return;
  conflict.linked = null;
  syncLine();
  queue.querySelector("[data-pending]")?.focus({ preventScroll: true });
});
boxes.addEventListener("click", (event) => {
  const box = event.target.closest("[data-project]");
  if (!box) return;
  const key = box.dataset.project;
  if (selected) {
    place(selected, key);
  } else if (event.detail > 0 && event.target.closest("strong")) {
    clearTimeout(openTimer);
    openTimer = setTimeout(() => openArchive(key, box), 270);
  } else {
    openArchive(key, box);
  }
});
boxes.addEventListener("dblclick", (event) => {
  const box = event.target.closest("[data-project]");
  if (box && event.target.closest("strong")) renameProject(box);
});
boxes.addEventListener("contextmenu", (event) => {
  const box = event.target.closest("[data-project]");
  if (!box) return;
  event.preventDefault();
  openFolder(box.dataset.project, box);
});
boxes.addEventListener("keydown", (event) => {
  const box = event.target.closest("[data-project]");
  if (box && event.key === "F2") {
    event.preventDefault();
    renameProject(box);
  }
});
screen.addEventListener("dragend", () => {
  screen.querySelectorAll(".drop-target, .relink-target, .merge-target").forEach((item) => item.classList.remove("drop-target", "relink-target", "merge-target"));
  underlay.classList.remove("source-drop");
});

function closeArchive(restoreFocus = true) {
  if (!archive.open) return;
  archive.close();
  viewing = sourceSelection = null;
  underlay.hidden = true;
  underlay.classList.remove("source-drop");
  board.inert = false;
  byId("lens").hidden = byId("settings").hidden = false;
  setLens(false);
  syncLine();
  if (!bench.hidden && restoreFocus) {
    const key = previousFocus?.dataset.project;
    const trigger = key && boxes.querySelector('[data-project="' + key + '"]');
    (trigger || byId("bench-home")).focus({ preventScroll: true });
  }
  previousFocus = null;
}
archive.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  closeArchive();
});
archiveContent.addEventListener("click", (event) => {
  const move = event.target.closest("[data-move-source]");
  const group = event.target.closest("[data-source]");
  const item = event.target.closest("[data-archived]");
  if (move) {
    moveSource(move.dataset.moveSource);
  } else if (group && !lensMode) {
    const key = group.dataset.source;
    if (sourceSelection && sourceSelection !== key) mergeSources(sourceSelection, key);
    else {
      sourceSelection = sourceSelection === key ? null : key;
      renderArchive();
      archiveContent.querySelector('[data-source="' + key + '"]')?.focus({ preventScroll: true });
    }
  } else if (item || group) {
    setLens(true);
    showPreview(item || group);
  }
});
archiveContent.addEventListener("dragstart", (event) => {
  const group = event.target.closest("[data-source]");
  if (!group) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(sourceMime, group.dataset.source);
  underlay.classList.add("source-drop");
});
archiveContent.addEventListener("dragover", (event) => {
  const group = event.target.closest("[data-source]");
  if (!group || !event.dataTransfer.types.includes(sourceMime)) return;
  event.preventDefault();
  group.classList.add("merge-target");
});
archiveContent.addEventListener("dragleave", (event) => event.target.closest("[data-source]")?.classList.remove("merge-target"));
archiveContent.addEventListener("drop", (event) => {
  const group = event.target.closest("[data-source]");
  const source = event.dataTransfer.getData(sourceMime);
  if (!group || !source) return;
  event.preventDefault();
  group.classList.remove("merge-target");
  underlay.classList.remove("source-drop");
  mergeSources(source, group.dataset.source);
});
underlay.addEventListener("dragover", (event) => {
  if (event.dataTransfer.types.includes(sourceMime)) event.preventDefault();
});
underlay.addEventListener("drop", (event) => {
  const source = event.dataTransfer.getData(sourceMime);
  if (!source) return;
  event.preventDefault();
  moveSource(source);
});

const inspectable = "[data-pending], [data-project], [data-archived], [data-source]";
archiveContent.addEventListener("scroll", () => {
  if (!previewTarget || !archiveContent.contains(previewTarget)) return;
  const clip = archiveContent.getBoundingClientRect();
  const card = previewTarget.getBoundingClientRect();
  if (card.bottom <= clip.top || card.top >= clip.bottom) showPreview();
  else positionPreview(previewTarget);
}, { passive: true });
for (const event of ["pointerover", "focusin"]) {
  bench.addEventListener(event, (input) => {
    const target = input.target.closest(inspectable);
    if (target !== previewTarget) showPreview(target);
  });
}
for (const event of ["pointerout", "focusout"]) {
  bench.addEventListener(event, (input) => {
    const target = input.target.closest(inspectable);
    if (target && !target.contains(input.relatedTarget)) showPreview();
  });
}
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || folder.open) return;
  if (event.key === "Escape") {
    if (fileDrag) clearFileDrag();
    else if (!trayMenu.hidden) {
      closeTray();
      tray.focus({ preventScroll: true });
    } else if (captureActive) stopCapture();
    else if (listening) showSettings(true);
    else if (lensMode) setLens(false);
    else if (archive.open) closeArchive();
    return;
  }
  const keys = shortcutFrom(event);
  if (!keys || event.repeat) return;
  if (listening) {
    event.preventDefault();
    shortcut = keys;
    capture.setAttribute("aria-keyshortcuts", keys);
    stopCapture();
    showSettings(true);
  } else if (keys === shortcut && running && bench.hidden) {
    event.preventDefault();
    startCapture();
  }
});

new ResizeObserver(() => {
  if (previewTarget?.isConnected && !preview.hidden) positionPreview(previewTarget);
  if (bench.hidden || settingsOpen || archive.open) return;
  if (pageSize() !== lastQueueSize) renderQueue();
  else syncLine();
}).observe(bench);
new ResizeObserver(() => { if (chatOpen) moveChat(chatOffset.x, chatOffset.y); }).observe(screen);
byId("reset").addEventListener("click", reset);
resetState();
stopCapture();
renderChat();
