const using_color = "#FF9933"; // 使用中の色
const empty_color = "#e0ffff"; // 空きの色


document.addEventListener("DOMContentLoaded", function() {// DOMの読み込みが完了したら実行
    // HTMLの解析が完了した時点で実行される
    // テーブルの配置
    generateTable().then(() => {
        // テーブルの配置が完了した後にfetchDataを呼び出す
        fetchData();
    });

    // インターバルで常に実行
    setInterval(fetchData, 5000);// 5秒ごとにfetchDataを実行

    // ランキングも5秒ごとに更新
    fetchAndDisplayRanking();
    setInterval(fetchAndDisplayRanking, 5000);
});

// weekly_login_time.txtを読み込んでランキングを表示
function fetchAndDisplayRanking() {
  // キャッシュ防止のために毎回異なるクエリを付与
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
    const using_pc= document.getElementById("使用");// 使用中の端末
    const empty_pc= document.getElementById("空き");// 空きの端末

    if (using_pc && empty_pc) {// 使用中と空きの端末が存在する場合
        using_pc.style.backgroundColor = using_color;// 使用中の端末の背景色を設定
        empty_pc.style.backgroundColor = empty_color;// 空きの端末の背景色を設定
    }



    fetch('php/data.php')// PHPファイルからデータを取得
    .then(response => response.json())// レスポンスをJSON形式に変換
    .then(json => {
      
        console.log("データを更新");// データの更新をコンソールに表示

        if(json.error){// エラーがある場合
            document.getElementById("debug").textContent = json.error;// エラーメッセージを表示
            return;
        }

        let is_new_time = false;// 新しい時間のフラグ
        let update_time = "";// 更新時間の初期化

        const users = json.data || json;// データを取得（json.dataが存在しない場合はjsonを使用）
        
        let sum_using = 0;// 使用中の端末数
        let sum_empty = 0;// 空きの端末数
        // 受け取ったデータを処理
        users.forEach(userObj => {
            const key = Object.keys(userObj)[0];// キーを取得
        
            if (key === "is_new_time") {// 新しい時間のフラグを取得
                is_new_time = userObj[key];// 新しい時間のフラグを設定
            }
        
            if (key === "update_time") {// 更新時間を取得
                update_time = userObj[key];// 更新時間を設定
            }
        
            console.log(key);// キーをコンソールに表示
            // 通常の座席処理
            const element = document.getElementById(key);// 要素を取得
            if (element) {
                // element.style.backgroundColor = userObj[key] ?  using_color  : empty_color;
                if(userObj[key]){// 使用中の端末の場合
                  element.style.backgroundColor = using_color;// 使用中の色を設定
                    sum_using++;// 使用中の端末数をカウント
                }
                else{
                    element.style.backgroundColor = empty_color;// 空きの端末の場合
                    sum_empty++;// 空きの端末数をカウント
                }
            }
        });

        // 使用率を表示
        const using_rate = document.getElementById("using_rate");// 使用率の要素を取得
        const comment = document.getElementById("comment");// コメントの要素を取得
        let rate = sum_using / (sum_using + sum_empty) * 100;// 使用率を計算
        if (using_rate && comment) {// 使用率とコメントの要素が存在する場合
            using_rate.textContent = rate.toFixed(2);// 使用率を小数点以下2桁で表示
            if(rate > 60){// 使用率が60%以上の場合
                using_rate.style.color = "red";// 使用率の色を赤に設定
                comment.textContent = "混雑しています";// コメントを更新

            } else if(rate > 30){// 使用率が30%以上60%未満の場合
                using_rate.style.color = "orange";
                comment.textContent = "やや混雑しています";
            } else {// 使用率が30%未満の場合
                using_rate.style.color = "blue";
                comment.textContent = "空き端末がたくさんあります";
            }
        }

        
        
        // is_new_timeとupdate_timeを使って表示
        const get_seat_status = document.getElementById("get_seat_status");// 座席情報の要素を取得

        if (is_new_time) {// 新しい時間のフラグがtrueの場合
            get_seat_status.innerHTML = "更新日時："+update_time;// 更新日時を表示
        } else {
            get_seat_status.innerHTML = "座席情報が取得できていません";// 座席情報が取得できない場合のメッセージを表示
        }
        
    });

}