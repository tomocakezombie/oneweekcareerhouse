const using_color = "#FF9933"; // 使用中の色
const empty_color = "#e0ffff"; // 空きの色


document.addEventListener("DOMContentLoaded", function() {
    // テーブルの配置
    generateTable().then(() => {
        // テーブルの配置が完了した後にfetchDataを呼び出す
        fetchData();
    });

    // インターバルで常に実行
    setInterval("fetchData()", 5000);
});



  // 座席の表示(一回のみ実行させる)
  function generateTable() {
    const table = document.getElementById("terminal-table");

    return fetch('seat_data.json')
    .then(response => response.json())
    .then(data => {
      const terminals = data; // 修正: terminalsをdataから取得
      terminals.forEach(rowData => {
        const row = document.createElement("tr");
        rowData.forEach(id => {
          const cell = document.createElement("td");
          if (id) { // 空白セルでない場合
            cell.id = id;
            cell.innerHTML = `
              <div id="${id}-name">${id}</div>
              <div id="${id}-data"></div>
            `;
            cell.classList.add("computers"); // スタイル適用
          } else {
            cell.classList.add("empty"); // 空白セルはスタイル適用
          }
          row.appendChild(cell);
        });
        table.appendChild(row);
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
            document.getElementById("debug").innerHTML = json.error;
            return;
        }

        let is_new_time = false;
        let update_time = "";

        const users = json.data || json;
        
        let sum_using = 0;
        let sum_empty = 0;
        // 受け取ったデータを処理
        users.forEach(userObj => {
            const key = Object.keys(userObj)[0];
        
            if (key === "is_new_time") {
                is_new_time = userObj[key];
            }
        
            if (key === "update_time") {
                update_time = userObj[key];
            }
        
            console.log(key);
            // 通常の座席処理
            const element = document.getElementById(key);
            if (element) {
                // element.style.backgroundColor = userObj[key] ?  using_color  : empty_color;
                if(userObj[key]){
                  element.style.backgroundColor = using_color;
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
            using_rate.innerHTML = rate;
            if(using_rate > 60){
                using_rate.style.color = "red";
                comment.innerHTML = "混雑しています";

            } else if(using_rate > 30){
                using_rate.style.color = "orange";
                comment.innerHTML = "やや混雑しています";
            } else {
                using_rate.style.color = "blue";
                comment.innerHTML = "空き端末がたくさんあります";
            }
        }

        
        
        // is_new_timeとupdate_timeを使って表示
        const get_seat_status = document.getElementById("get_seat_status");
        
        if (is_new_time) {
            get_seat_status.innerHTML = "更新日時："+update_time;
        } else {
            get_seat_status.innerHTML = "座席情報が取得できていません";
        }
        
    });

}