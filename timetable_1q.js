const timetable_zenki = [];
const timetable_kouki = [];

const termPeriods = {
  "1Q": { start: "2026-04-01", end: "2026-06-10" },
  "2Q": { start: "2026-06-11", end: "2026-08-7" },
  "3Q": { start: "2026-8-08", end: "2026-11-30" },
  "4Q": { start: "2026-12-02", end: "2027-02-9" }
};

const colors = [
  "#ff8181",
  "#ffb7b2",
  "#ffb38a",
  "#ffd6a5",
  "#fafe97",
  "#ecffa0",
  "#caffbf",
  "#baffc9",
  "#9bf6ff",
  "#a0e7e5",
  "#a0c4ff",
  "#bdb2ff",
  "#d0bfff",
  "#e7c6ff",
  "#ffc6ff" 
];

const colorMap = {}; 
let colorIndex = 0;

// 曜日/時限マップ
const dayMap = { 月: 1, 火: 2, 水: 3, 木: 4, 金: 5 };
const timeMap = { "1限": 0, "2限": 1, "3限": 2, "4限": 3, "5限": 4 };


// JSON 読み込み
fetch("timetable.json")
  .then(res => res.json())
  .then(data => {
    timetable_zenki.push(...data.zenki);
    timetable_kouki.push(...data.kouki);

    const currentTerm = getCurrentTerm();

    // プルダウンも同期
    document.getElementById("termSelect").value = currentTerm;

    renderTimetable(currentTerm);
  })
  .catch(err => console.error(err));

const memoEl = document.getElementById("modal-memo");


//＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
//タッチイベント
//＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

document.getElementById("termSelect").addEventListener("change", e=>{
  renderTimetable(e.target.value);
});

memoEl.addEventListener("input", () => {
  const code = memoEl.dataset.code;
  if (!code) return;

  localStorage.setItem("memo_" + code, memoEl.value);
});

document.getElementById("close-btn").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});

document.getElementById("toggle-pdf").onclick = () => {
  document.getElementById("pdf").classList.toggle("hidden");
};

//＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
//使用関数
//＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

//  メモモーダルを開く
function openModal(lesson) {
  const modal = document.getElementById("modal");

  document.getElementById("modal-title").textContent = lesson.name;

  const memo = document.getElementById("modal-memo");

  // 保存されてるメモを読み込む
  const saved = localStorage.getItem("memo_" + lesson.code);
  memo.value = saved ? saved : "";

  // 現在のlessonを保持（後で使う）
  memo.dataset.code = lesson.code;

  modal.classList.remove("hidden");
}

//　講義コードに色を対応させる（前期と後期）
function getColor(code) {
  if (!colorMap[code]) {
    colorMap[code] = colors[colorIndex % colors.length];
    colorIndex++;
  }
  return colorMap[code];
}

//  全角半角の変換
function normalizeTerm(term) {
  if (!term) return "";
  return term.replace("１","1")
             .replace("２","2")
             .replace("３","3")
             .replace("４","4")
             .replace("Ｑ","Q")
             .replace("ｑ","q")
             .trim();
}

//どのクォーターか取得
function getCurrentTerm() {
  const today = new Date();

  for (const term in termPeriods) {
    const start = new Date(termPeriods[term].start);
    const end = new Date(termPeriods[term].end);

    if (today >= start && today <= end) {
      return term;
    }
  }

  return "1Q"; // デフォルト
}

//　時間割の描画
function renderTimetable(q = "1Q") {
  let timetable = timetable_zenki;
  if(q === "3Q" || q === "4Q") timetable = timetable_kouki;

  const table = document.getElementById("timetable");
  const tbody = table.querySelector("tbody");

  // セルクリア + 背景リセット
  tbody.querySelectorAll("td").forEach(td => {
    td.innerHTML = "";
    td.style.backgroundColor = "";
    td.className = "";
  });

  timetable.forEach((row,rowIndex) => {
    row.forEach((lessonCell, dayIndex) => {
      if(!lessonCell) return;

      const lessonArrays = Array.isArray(lessonCell) ? lessonCell : [lessonCell];

      lessonArrays.forEach(lessonArray => {
        if(!lessonArray) return;
        const lessons = Array.isArray(lessonArray) ? lessonArray : [lessonArray];

        lessons.forEach(lesson => {
          if(!lesson) return;
          if(normalizeTerm(lesson.term)!==q && lesson.term!=="半期") return;

          const tr = tbody.children[rowIndex];
          if(!tr) return;
          const td = tr.children[dayIndex+1];
          if(!td) return;

          td.classList.add("has-lesson");

          // td に講義コードのクラスを付与 → CSS 背景色適用
          const color = getColor(lesson.code);
          td.classList.add(`lesson-${lesson.code}`);
          td.style.backgroundColor = color;

          // 内側 div 角丸背景
          td.innerHTML = `
            <div class="lesson">
                <div class="lesson-room">${lesson.room}</div>
                <div class="lesson-type ${lesson.type}">${lesson.type}</div>
              <span class="lesson-name">${lesson.name}</span><br>
              <span class="lesson-teacher">${lesson.teacher}</span><br>
              <div class="lesson-buttons">
                <button class="syllabus-btn">シラバス</button>
                <button class="memo-btn">メモ</button>
              </div>
            </div>
          `;
          const syllabusBtn = td.querySelector(".syllabus-btn");
          const memoBtn = td.querySelector(".memo-btn");

          syllabusBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            window.open(lesson.url, "_blank");
          });
          memoBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(lesson, td);
          });
        });
      });
    });
  });

  // 今日の曜日目立たせる
  const days = ["日","月","火","水","木","金","土"];
  const today = new Date();
  const dayStr = days[today.getDay()]; // 今日の曜日文字列
  const dayIndexMap = { "月":1, "火":2, "水":3, "木":4, "金":5 };
  const colIndex = dayIndexMap[dayStr];

  if(colIndex) {
    const th = document.querySelector(`#timetable thead tr th:nth-child(${colIndex+1})`);
    if(th) th.classList.add("today-header");
  }
}


