const $=id=>document.getElementById(id);
const won=n=>Math.round(Number(n)||0).toLocaleString("ko-KR")+"원";
const fmt=n=>Math.round(Number(n)||0).toLocaleString("ko-KR");
const parseDate=v=>{const d=new Date(v+"T00:00:00");return isNaN(d)?null:d};
const addMonths=(d,m)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x};
const dateStr=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`};
const daysBetween=(a,b)=>Math.max(0,Math.round((b-a)/86400000));

function pmt(rate,nper,pv){if(rate===0)return -pv/nper;return -(rate*pv)/(1-Math.pow(1+rate,-nper))}
function ppmt(rate,per,nper,pv){return pmt(rate,nper,pv)-ipmt(rate,per,nper,pv)}
function ipmt(rate,per,nper,pv){
  if(rate===0)return 0;
  const payment=pmt(rate,nper,pv);
  let bal=pv;
  for(let i=1;i<per;i++) bal+=payment+bal*rate;
  return -(bal*rate);
}
function validate(){
  const gs=parseDate($("graceStart").value), ge=parseDate($("graceEnd").value), rs=parseDate($("repayStart").value);
  if(!gs||!ge||!rs) throw Error("거치 시작일·종료일과 원금상환 시작일을 모두 입력해주세요.");
  if(ge<gs) throw Error("거치 종료일은 거치 시작일보다 빠를 수 없습니다.");
  if(rs<ge) throw Error("원금상환 시작일은 거치 종료일 이후로 입력해주세요.");
  if(Number($("principal").value)<=0) throw Error("배정금액은 0보다 커야 합니다.");
  if(Number($("rate").value)<0) throw Error("금리는 0 이상이어야 합니다.");
}
function buildSchedule(){
  validate();
  const principal=Number($("principal").value), annualRate=Number($("rate").value)/100;
  const freq=Number($("frequency").value), months=12/freq, years=Number($("years").value);
  const nper=years*freq, start=parseDate($("repayStart").value), change=parseDate($("changeStart").value);
  const method=$("method").value, changeEvery=Number($("changeEvery").value)||0, changeUnit=$("changeUnit").value;
  const rows=[]; let balance=principal, previous=parseDate($("graceEnd").value);
  for(let i=1;i<=nper;i++){
    const payDate=addMonths(start,months*(i-1));
    const endDate=i===nper?addMonths(start,months*nper):addMonths(start,months*i);
    const rate=annualRate; // 1차 버전: 고정금리 기준. 변동금리 이벤트 구조는 후속 확장.
    const dayCount=daysBetween(previous,payDate);
    let principalPay, interestPay;
    if(method==="equal-principal"){
      principalPay=i===nper?balance:Math.round(principal/nper);
      interestPay=Math.round(balance*dayCount*rate/365);
    }else{
      const periodic=rate/freq;
      principalPay=Math.round(ppmt(periodic,i,nper,-principal));
      interestPay=Math.round(ipmt(periodic,i,nper,-principal));
      if(i===nper) principalPay=balance;
    }
    principalPay=Math.max(0,Math.min(balance,principalPay));
    const payment=principalPay+interestPay;
    balance=Math.max(0,balance-principalPay);
    rows.push({no:i,date:dateStr(payDate),days:dayCount,rate:rate*100,principal:principalPay,interest:interestPay,payment,balance});
    previous=payDate;
  }
  return {rows,principal,rate:annualRate*100,method,fund:$("fund").value,dorm:$("dormName").value,frequency:freq,createdAt:new Date().toISOString()};
}
let current=null;

function render(result){
  current=result;
  $("resultSummary").textContent=`${result.dorm} · ${result.fund} · ${result.frequency===4?"분기":"반기"} · ${result.method==="equal-principal"?"원금 균등":"원리금 균등"}`;
  const sums=result.rows.reduce((a,r)=>(a.p+=r.principal,a.i+=r.interest,a.pay+=r.payment,a),{p:0,i:0,pay:0});
  $("sumPrincipal").textContent=won(sums.p);$("sumInterest").textContent=won(sums.i);$("sumPayment").textContent=won(sums.pay);
  $("finalBalance").textContent=won(result.rows.at(-1)?.balance||0);
  $("scheduleTable").querySelector("tbody").innerHTML=result.rows.map(r=>`<tr><td>${r.no}</td><td>${r.date}</td><td>${r.days}</td><td>${r.rate.toFixed(4)}%</td><td>${fmt(r.principal)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.payment)}</td><td>${fmt(r.balance)}</td></tr>`).join("");
  localStorage.setItem("happydorm_last_result",JSON.stringify(result));
  updateDashboard();
  document.querySelector('[data-tab="schedule"]').click();
}
function updateDashboard(){
  const saved=JSON.parse(localStorage.getItem("happydorm_history")||"[]");
  $("statDorms").textContent=saved.length;
  $("statPrincipal").textContent=won(saved.reduce((s,x)=>s+x.principal,0));
  $("statBalance").textContent=won(saved.reduce((s,x)=>s+(x.rows?.at(-1)?.balance||0),0));
  const upcoming=saved.reduce((s,x)=>s+(x.rows?.[0]?.payment||0),0);
  $("statUpcoming").textContent=won(upcoming);
  $("historyList").innerHTML=saved.length?saved.map((x,i)=>`<div class="history-item"><div><strong>${x.dorm}</strong><small>${x.fund} · ${x.frequency===4?"분기":"반기"} · ${x.method==="equal-principal"?"원금 균등":"원리금 균등"}</small></div><button class="secondary" onclick="loadHistory(${i})">불러오기</button></div>`).join(""):`<div class="empty">저장된 기숙사 자료가 없습니다.</div>`;
}
window.loadHistory=i=>{const a=JSON.parse(localStorage.getItem("happydorm_history")||"[]");const x=a[i];if(x)render(x)};
function saveResult(r){
  let a=JSON.parse(localStorage.getItem("happydorm_history")||"[]");
  a=a.filter(x=>x.dorm!==r.dorm);a.unshift(r);localStorage.setItem("happydorm_history",JSON.stringify(a.slice(0,100)));updateDashboard();
}
$("loanForm").addEventListener("submit",e=>{e.preventDefault();$("error").classList.add("hidden");try{const r=buildSchedule();render(r);saveResult(r)}catch(err){$("error").textContent=err.message;$("error").classList.remove("hidden")}});
$("saveOnly").addEventListener("click",()=>{try{const r=buildSchedule();saveResult(r);$("error").textContent="계산 조건과 결과를 저장했습니다.";$("error").classList.remove("hidden")}catch(err){$("error").textContent=err.message;$("error").classList.remove("hidden")}});
$("downloadXlsx").addEventListener("click",()=>{if(!current)return alert("먼저 원리금 테이블을 산출해주세요.");const data=current.rows.map(r=>({"회차":r.no,"상환일":r.date,"이자계산일수":r.days,"적용금리":r.rate/100,"원금상환액":r.principal,"이자상환액":r.interest,"원리금상환액":r.payment,"잔액":r.balance}));const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"원리금 테이블");XLSX.writeFile(wb,`${current.dorm||"원리금"}_상환계획표.xlsx`)});
$("print").onclick=()=>window.print();
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
$("resetAll").onclick=()=>{if(confirm("브라우저에 저장된 모든 원리금 자료를 삭제할까요?")){localStorage.removeItem("happydorm_history");localStorage.removeItem("happydorm_last_result");location.reload()}};
updateDashboard();
try{const last=JSON.parse(localStorage.getItem("happydorm_last_result"));if(last)render(last)}catch(e){}
