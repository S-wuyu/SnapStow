"use strict";

const id = (name) => document.getElementById(name);
const chat = id("chat-panel");
const bench = id("workbench-panel");
const messages = id("messages");
const selection = id("selection");
const items = [...messages.querySelectorAll("[data-item]")];
const pick = id("pick-panel");
const captureButton = id("capture");
const quickButton = id("quick");
const next = id("next");
const workbenchButton = id("show-workbench");
const chatButton = id("show-chat");
const queue = id("queue-items");
const boxes = [...id("boxes").querySelectorAll("[data-project]")];
const dialog = id("archive");
const status = id("status");

const sample = {
  sheet: { name: "验收清单.xlsx", source: "支付改版研发群", note: "林一发来一份验收清单。", type: "附件 · 48 KB" },
  link: { name: "测试环境", source: "支付改版研发群", note: "https://pay.example.com/staging", type: "网址 · 示例地址" },
  note: { name: "验收备注", source: "支付改版研发群", note: "这周用下面这版清单验收。", type: "备注" },
  review: { name: "回归记录.pdf", source: "示例测试群", note: "这是演示用的回归记录，来源群尚未关联项目。", type: "附件 · 126 KB" },
};
const projects = { pay: "支付改版", portal: "官网更新" };
const copy = [
  ["框住要留的消息", "点「开始圈选」，在聊天中拖一个方框。也可以用「点选资料」完成圈选。"],
  ["松手，继续工作", "圈选层已经关闭。需要查看结果时，打开工作台。"],
  ["打开项目箱", "点「支付改版」看刚才的资料。也可以把待确认的示例文件拖入箱子。"],
  ["资料已按来源收好", "展开资料的来源，看看它是在哪个群里收到的。也可以回到群聊继续圈选。"],
];

let stage = 0;
let captureActive = false;
let gesture = null;
let queuedSelection = null;
let archived = new Map();
let pending = new Map([["review", "待选项目"]]);
let flashTimer;

function setStage(value) {
  stage = value;
  const [title, instruction] = copy[value];
  id("guide-title").textContent = title;
  id("guide-copy").textContent = instruction;
  document.querySelectorAll(".steps li").forEach((step, index) => {
    if (index === Math.min(value, 2)) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  captureButton.hidden = quickButton.hidden = value !== 0;
  next.hidden = value !== 1;
}

function announce(message = "") {
  status.textContent = message;
}

function switchView(view) {
  const inChat = view === "chat";
  if (!inChat) {
    stopCapture();
    pick.hidden = true;
  }
  chat.hidden = !inChat;
  bench.hidden = inChat;
  chatButton.setAttribute("aria-pressed", String(inChat));
  workbenchButton.setAttribute("aria-pressed", String(!inChat));
  queuedSelection = null;
  renderBench();
  announce();
  setStage(inChat ? 0 : 2);
}

function stopCapture() {
  const pointer = gesture?.pointer;
  gesture = null;
  if (pointer !== undefined && messages.hasPointerCapture(pointer)) messages.releasePointerCapture(pointer);
  captureActive = false;
  selection.hidden = true;
  messages.classList.remove("capturing");
  id("cancel-capture").hidden = true;
  id("capture-hint").textContent = "可圈收附件、链接和备注。";
}

function startCapture() {
  if (captureActive) return;
  pick.hidden = true;
  captureActive = true;
  items.forEach((item) => item.classList.remove("marked"));
  messages.classList.add("capturing");
  id("cancel-capture").hidden = false;
  id("capture-hint").textContent = "拖过虚线卡片，可按 Esc 取消。";
  announce("圈选已开始。在聊天内容上拖出一个方框。");
}

function pointerPoint(event) {
  const bounds = messages.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
  };
}

function rectangleTo(point) {
  const { x, y } = gesture.start;
  return {
    left: Math.min(x, point.x),
    top: Math.min(y, point.y),
    width: Math.abs(x - point.x),
    height: Math.abs(y - point.y),
  };
}

function drawSelection(rectangle) {
  for (const [property, value] of Object.entries(rectangle)) selection.style[property] = `${value}px`;
  selection.hidden = false;
}

function coveredItems(rectangle) {
  const bounds = messages.getBoundingClientRect();
  return items.filter((item) => {
    const card = item.getBoundingClientRect();
    const left = Math.max(bounds.left + rectangle.left, card.left);
    const right = Math.min(bounds.left + rectangle.left + rectangle.width, card.right);
    const top = Math.max(bounds.top + rectangle.top, card.top);
    const bottom = Math.min(bounds.top + rectangle.top + rectangle.height, card.bottom);
    const coverage = Math.max(0, right - left) * Math.max(0, bottom - top);
    return coverage >= card.width * card.height * 0.18;
  }).map((item) => item.dataset.item);
}

function submitCapture(chosen, moveFocus = false) {
  if (!chosen.length) {
    announce("框内还没有资料。请拖过聊天中的任一资料卡片。");
    return;
  }
  stopCapture();
  pick.hidden = true;
  items.forEach((item) => item.classList.toggle("marked", chosen.includes(item.dataset.item)));
  const originalMissing = document.querySelector('[name="scenario"]:checked').value === "missing";
  for (const key of chosen) {
    if (archived.has(key)) continue;
    if (key === "sheet" && originalMissing) {
      pending.set(key, "本地未找到");
    } else {
      pending.delete(key);
      archived.set(key, "pay");
    }
  }
  setStage(1);
  announce("已提交圈选。");
  if (moveFocus || document.activeElement === captureButton) next.focus({ preventScroll: true });
}

function renderBench() {
  id("queue-count").textContent = `${pending.size} 项`;
  queue.replaceChildren();
  if (!pending.size) {
    const empty = document.createElement("p");
    empty.textContent = "暂无待处理资料";
    queue.append(empty);
  }
  for (const [key, reason] of pending) {
    const assignable = key === "review";
    const card = document.createElement(assignable ? "button" : "div");
    card.className = "queue-card";
    const name = document.createElement("strong");
    name.textContent = sample[key].name;
    const state = document.createElement("small");
    state.textContent = reason;
    card.append(name, state);
    if (assignable) {
      card.type = "button";
      card.dataset.pending = key;
      card.draggable = true;
      card.setAttribute("aria-pressed", String(queuedSelection === key));
    }
    queue.append(card);
  }
  for (const box of boxes) {
    const key = box.dataset.project;
    const count = [...archived.values()].filter((project) => project === key).length;
    id(`${key}-count`).textContent = `${count} 项`;
    const action = queuedSelection ? "归档到" : "打开";
    box.setAttribute("aria-label", `${action}${projects[key]}项目箱，${count} 项`);
  }
}

function placeInProject(key, box) {
  if (key !== "review" || !pending.has(key)) return;
  const project = box.dataset.project;
  archived.set(key, project);
  pending.delete(key);
  queuedSelection = null;
  for (const entry of boxes) entry.classList.remove("drop-target", "received");
  renderBench();
  box.classList.add("received");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => box.classList.remove("received"), 650);
  announce(`${sample[key].name} 已归档到${projects[project]}。`);
  box.focus({ preventScroll: true });
}

function archiveItem(item) {
  const li = document.createElement("li");
  li.className = "archive-item";
  const name = document.createElement("strong");
  name.textContent = item.name;
  const meta = document.createElement("small");
  meta.textContent = item.type;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "查看示例来源";
  const note = document.createElement("p");
  note.textContent = item.note;
  details.append(summary, note);
  li.append(name, meta, details);
  return li;
}

function openArchive(project) {
  id("archive-title").textContent = projects[project];
  const content = id("archive-content");
  content.replaceChildren();
  const groups = new Map();
  for (const [key, destination] of archived) {
    if (destination !== project) continue;
    const item = sample[key];
    if (!groups.has(item.source)) groups.set(item.source, []);
    groups.get(item.source).push(item);
  }
  for (const [source, entries] of groups) {
    const group = document.createElement("section");
    group.className = "archive-group";
    const title = document.createElement("h4");
    title.textContent = source;
    const list = document.createElement("ul");
    list.className = "archive-list";
    list.append(...entries.map(archiveItem));
    group.append(title, list);
    content.append(group);
  }
  if (!groups.size) {
    const empty = document.createElement("p");
    empty.className = "archive-empty";
    empty.textContent = "这个箱子还没有资料。";
    content.append(empty);
  } else {
    setStage(3);
  }
  dialog.showModal();
}

captureButton.addEventListener("click", startCapture);
quickButton.addEventListener("click", () => {
  stopCapture();
  pick.hidden = false;
  pick.querySelector("input").focus();
  announce();
});
pick.addEventListener("submit", (event) => {
  event.preventDefault();
  const chosen = new FormData(pick).getAll("item");
  if (chosen.length) submitCapture(chosen, true);
  else announce("请至少选择一项资料。");
});
id("cancel-pick").addEventListener("click", () => {
  pick.hidden = true;
  quickButton.focus();
  announce();
});

function cancelCapture() {
  stopCapture();
  announce("已取消圈选。");
  captureButton.focus({ preventScroll: true });
}

id("cancel-capture").addEventListener("click", cancelCapture);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && captureActive) cancelCapture();
});
messages.addEventListener("pointerdown", (event) => {
  if (!captureActive || gesture || event.button !== 0) return;
  gesture = { start: pointerPoint(event), pointer: event.pointerId };
  messages.setPointerCapture(event.pointerId);
  drawSelection(rectangleTo(gesture.start));
});
messages.addEventListener("pointermove", (event) => {
  if (gesture?.pointer === event.pointerId) drawSelection(rectangleTo(pointerPoint(event)));
});
messages.addEventListener("pointerup", (event) => {
  if (gesture?.pointer !== event.pointerId) return;
  const chosen = coveredItems(rectangleTo(pointerPoint(event)));
  gesture = null;
  selection.hidden = true;
  submitCapture(chosen);
});
messages.addEventListener("lostpointercapture", () => {
  gesture = null;
  selection.hidden = true;
});

chatButton.addEventListener("click", () => switchView("chat"));
workbenchButton.addEventListener("click", () => switchView("bench"));
next.addEventListener("click", () => {
  switchView("bench");
  boxes[0].focus({ preventScroll: true });
});
queue.addEventListener("click", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card) return;
  queuedSelection = queuedSelection === card.dataset.pending ? null : card.dataset.pending;
  renderBench();
  queue.querySelector("[data-pending]").focus({ preventScroll: true });
  announce(queuedSelection ? "已选回归记录.pdf。请选择一个项目箱。" : "已取消选择文件。");
});
queue.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-pending]");
  if (!card) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-snapstow-item", card.dataset.pending);
});
queue.addEventListener("dragend", () => {
  for (const box of boxes) box.classList.remove("drop-target");
});
for (const box of boxes) {
  box.addEventListener("click", () => {
    if (queuedSelection) placeInProject(queuedSelection, box);
    else openArchive(box.dataset.project);
  });
  box.addEventListener("dragover", (event) => {
    if (!event.dataTransfer.types.includes("application/x-snapstow-item")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    box.classList.add("drop-target");
  });
  box.addEventListener("dragleave", (event) => {
    if (!box.contains(event.relatedTarget)) box.classList.remove("drop-target");
  });
  box.addEventListener("drop", (event) => {
    const key = event.dataTransfer.getData("application/x-snapstow-item");
    if (!key) return;
    event.preventDefault();
    box.classList.remove("drop-target");
    placeInProject(key, box);
  });
}

id("reset").addEventListener("click", () => {
  archived = new Map();
  pending = new Map([["review", "待选项目"]]);
  stopCapture();
  pick.reset();
  pick.hidden = true;
  document.querySelector('[name="scenario"][value="found"]').checked = true;
  items.forEach((item) => item.classList.remove("marked"));
  boxes.forEach((box) => box.classList.remove("received", "drop-target"));
  switchView("chat");
  announce("已重置演示。");
});

renderBench();
