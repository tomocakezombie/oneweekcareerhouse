const using_color = "#FF9933"; // 使用中の色
const empty_color = "#e0ffff"; // 空きの色

// ★ 上位3人のユーザ名を保持するグローバル変数を追加
let top3Users = [];
const top3Colors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // 金・銀・銅

document.addEventListener("DOMContentLoaded", function() {
    generateTable().then(() => {
        fetchData();
    });
    setInterval(fetchData, 5000);
    fetchAndDisplayRanking();
    setInterval(fetchAndDisplayRanking, 5000);
});

// weekly_login_time.txtを読み込んでランキングを表示
function fetchAndDisplayRanking() {
  const url = './weekly_login_time.txt?nocache=' + new Date().getTime();
  fetch(url)
    .then(response => response.text())
    .then(text => {
      const lines = text.trim().split('\n').filter(line => line);
      const users = lines.map(line => {
        const [name, time] = line.split(',');
        return { name, seconds: timeToSeconds(time), time };
      });
      users.sort((a, b) => b.seconds - a.seconds);

      // ★ 上位3人のユーザ名を保存
      top3Users = users.slice(0, 3).map(u => u.name);

      const top10 = [];
      for (let i = 0; i < 10; i++){
        if(users[i]){
          top10.push(users[i]);
        }else{
          top10.push({name: "NONE", time: "NONE", seconds: 0});
        }
      }
      const rankIcons = [
        "🥇", // 1位
        "🥈", // 2位
        "🥉"  // 3位
      ];
      const rankingHtml = top10.map((u, i) =>
        `<tr class="rank-${i + 1}">
          <td>${rankIcons[i] || (i + 1 + "位")}</td>
          <td>${u.name}</td>
          <td>${u.time}</td>
        </tr>`
      ).join('');
      document.getElementById('weekly-ranking').innerHTML =
        `<table>
          <thead>
            <tr><th>順位</th><th>ユーザ名</th><th>累計時間</th></tr>
          </thead>
          <tbody>${rankingHtml}</tbody>
        </table>`;
    })
    .catch(err => {
      document.getElementById('weekly-ranking').textContent = 'ランキングの取得に失敗しました';
    });
}

// "hh:mm:ss"を秒に変換
function timeToSeconds(timeStr) {
  const [h, m, s] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}



  // 座席の表示(一回のみ実行させる)
  function generateTable() {
    const table = document.getElementById("terminal-table");// テーブルの要素を取得

    return fetch('seat_data.json')// JSONファイルを取得
    .then(response => response.json())// レスポンスをJSON形式に変換
    .then(data => {// データを処理
      const terminals = data; // 修正: terminalsをdataから取得
      terminals.forEach(rowData => {
        const row = document.createElement("tr");// 新しい行を作成
        rowData.forEach(id => {
          const cell = document.createElement("td");// 新しいセルを作成
          if (id) { // 空白セルでない場合
            cell.id = id;
            cell.innerHTML = `
              <div id="${id}-name">${id}</div>
              <div id="${id}-data"></div>
            `;// セルの内容を設定
            cell.classList.add("computers"); // スタイル適用
          } else {
            cell.classList.add("empty"); // 空白セルはスタイル適用
          }
          row.appendChild(cell);// セルを行に追加
        });
        table.appendChild(row);// 行をテーブルに追加
      });
    });
  }

  // 常に起動させる
  function fetchData() {
    const using_pc= document.getElementById("使用");
    const empty_pc= document.getElementById("空き");

    if (using_pc && empty_pc) {
        using_pc.style.backgroundColor = using_color;
        empty_pc.style.backgroundColor = empty_color;
    }

    fetch('php/data.php')
    .then(response => response.json())
    .then(json => {
        console.log("データを更新");

        if(json.error){
            document.getElementById("debug").textContent = json.error;
            return;
        }

        let is_new_time = false;
        let update_time = "";

        const users = json.data || json;
        
        let sum_using = 0;
        let sum_empty = 0;

        users.forEach(userObj => {
            const key = Object.keys(userObj)[0];
        
            if (key === "is_new_time") {
                is_new_time = userObj[key];
            }
        
            if (key === "update_time") {
                update_time = userObj[key];
            }
        
            console.log(key);
            const element = document.getElementById(key);
            if (element) {
                // ★ 使用中の場合、上位3人なら特別色を適用
                if(userObj[key]){
                    // ユーザ名を取得
                    const nameDiv = document.getElementById(`${key}-name`);
                    let userName = nameDiv ? nameDiv.textContent : "";
                    // 上位3人に該当するか判定
                    let colorIndex = top3Users.indexOf(userName);
                    if(colorIndex !== -1){
                        element.style.backgroundColor = top3Colors[colorIndex];
                    }else{
                        element.style.backgroundColor = using_color;
                    }
                    sum_using++;
                }
                else{
                    element.style.backgroundColor = empty_color;
                    sum_empty++;
                }
            }
        });

        // 使用率を表示
        const using_rate = document.getElementById("using_rate");
        const comment = document.getElementById("comment");
        let rate = sum_using / (sum_using + sum_empty) * 100;
        if (using_rate && comment) {
            using_rate.textContent = rate.toFixed(2);
            if(rate > 60){
                using_rate.style.color = "red";
                comment.textContent = "混雑しています";
            } else if(rate > 30){
                using_rate.style.color = "orange";
                comment.textContent = "やや混雑しています";
            } else {
                using_rate.style.color = "blue";
                comment.textContent = "空き端末がたくさんあります";
            }
        }

        const get_seat_status = document.getElementById("get_seat_status");
        if (is_new_time) {
            get_seat_status.innerHTML = "更新日時："+update_time;
        } else {
            get_seat_status.innerHTML = "座席情報が取得できていません";
        }
        
    });

}