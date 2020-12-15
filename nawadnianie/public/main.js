let dev = {
  activeLine: 0,
  maxRecord: 6,
  line1: [],
  line2: [],
  line3: [],
  line4: [],
  outs: [1,0,1,0,2],
  outsReq: [],
  time: [2020,3,2,7,1,1,1],
  timeReq: [],
  dolej: [2,3,4,5,10],
  mode: "auto", //auto,manual,dolewanie
  dolewanie: "off"
};

let Socket;

function parseData(data) {
  // head 1-4: nastawy dla sekcji 1-4
  // head 5: nastawy dla funkcji dolej
  // head 6: wyjścia
  // head 10: czas
  let msg = JSON.parse(data);
  // console.log(msg);
  if((msg.head >= 1)&&(msg.head <= 4)){
    dev['line'+msg.head] = [...msg['line'+msg.head]];
    updateLine(msg.head);
  }
  if(msg.head == 10){
    dev['outs'] = [...msg['outs']];
    updateDevice();
  }
  if(msg.head == 11){
    dev.dolej = [...msg.dolej];
    updateDolej();
  }
  if(msg.head == 12){
    dev['time'] = [...msg['time']];
    displayTime();
  }
};

function sendMsg(msgType) {
  console.log(msgType);
  if("saveSettings" == msgType){
    for (var i = 1; i < 5; i++) {
      let msg = {};
      msg.head = i;
        msg['line'+i] = [...dev['line'+i]];
        sendToSocket(msg);
    }
  }
  if("setOutputs" == msgType){
    let msg = {
      head: 10
    };
    msg.outs = [...dev.outsReq];
    sendToSocket(msg);
  }
  if("dolej" == msgType){
    let msg = {
      head: 11
    };
    getDolejSettings();
    msg.dolej = [...dev.dolej];
    sendToSocket(msg);
  }
  if("updateTime" == msgType){
    let msg = {
      head: 12
    };
    msg.time = [...dev.timeReq];
    sendToSocket(msg);
  }
};

function handleUpdateTime() {
    var actDate = new Date();
    let dayOfWeek = actDate.getDay();
    if(dayOfWeek == 0) dayOfWeek=7;
    dev.timeReq[0] = actDate.getFullYear();
    dev.timeReq[1] = actDate.getMonth()+1;
    dev.timeReq[2] = actDate.getDate();
    dev.timeReq[3] = dayOfWeek;
    dev.timeReq[4] = actDate.getHours();
    dev.timeReq[5] = actDate.getMinutes();
    dev.timeReq[6] = actDate.getSeconds();
    sendMsg("updateTime");
}

function updateDevice() {
  let outList = document.querySelectorAll('.btnOut');
  for(let i = 0; i < outList.length; i++){
    if(dev.outs[i] == 1) outList[i].classList.add("btnOutActiv");
    else outList[i].classList.remove("btnOutActiv");
  }
  let btnTryb = document.getElementById("btnTryb")
  // tryby: 0-auto, 1-manual, 2-dolewanie
  if(dev.outs[4] == 1) dev.mode = "manual", btnTryb.innerText = "Tryb manualny";
  else if(dev.outs[4] == 2) dev.mode = "dolewanie", btnTryb.innerText = "Tryb dolewania";
  else dev.mode = "auto", btnTryb.innerText = "Tryb automatyczny";

  if(dev.mode == "dolewanie"){
    document.getElementById("btnDolej").innerText = "Przerwij dolewanie";
  }
  else{
    document.getElementById("btnDolej").innerText = "Dolej";
  }
}

function displayTime() {
  let time = "";
  let daysArr = ["Pon", "Wto", "Sro", "Czw","Pt", "Sob", "Nie"];
  time = dev.time[0]+'-'+ifZero(dev.time[1])+'-'+ifZero(dev.time[2])+' ';
  time += daysArr[dev.time[3]-1]+' '+ifZero(dev.time[4])+':'+ifZero(dev.time[5])+':'+ifZero(dev.time[6]);
  document.getElementById("czas").innerText = time;
}

function ifZero(val) {
  let txt = '';
  if(val<10) txt='0'+val;
  else txt=''+val;
  return txt;
}

let isOnESP8266 = 0;



document.addEventListener("DOMContentLoaded", function(event) {
  if(isOnESP8266){
    Socket = new WebSocket('ws://'+window.location.hostname+':81/');
    Socket.onmessage = function(event){
      parseData(event.data);
    }
  }
  displayTime();
  showSettings();
  updateDevice();
// updateDolej();

  let mainWindow = document.getElementById("mainWindow");
  let addWindow = document.getElementById("addWindow");
  let addHeading = document.getElementById("addHeading");
  var butAddTab = document.getElementsByClassName("btnAdd");
  var butDayTab = document.getElementsByClassName("btnDay");
  var butOutTab = document.getElementsByClassName("btnOut");

  document.getElementById("cancelSet").addEventListener("click", function() {
    addWindow.style.display = "none";
    mainWindow.style.display = "flex";
  });
  document.getElementById("addSet").addEventListener("click", function() {
    validateSetting();
  });
  document.getElementById("btnTryb").addEventListener("click", function() {
    handleModeKey();
  });
  document.getElementById("btnDolej").addEventListener("click", function() {
    handleDolejKey();
  });
  document.getElementById("updateTime").addEventListener("click", function() {
    handleUpdateTime();
  });
  document.getElementById("btnSaveSet").addEventListener("click", function() {

    sendMsg("dolej");
    sendMsg("saveSettings");
  })
  for (var i = 0; i < butAddTab.length; i++) {
      butAddTab[i].addEventListener('click', addClick, false);
  }
  for (var i = 0; i < butDayTab.length; i++) {
      butDayTab[i].addEventListener('click', dayClick, false);
  }
  for (var i = 0; i < butOutTab.length; i++) {
      butOutTab[i].addEventListener('click', outClick, false);
  }

});

function outClick() {
  if(dev.mode == "manual"){
    let num = parseInt(this.id.replace("btnOut",""))
    console.log(num);
    dev.outsReq = [...dev.outs];
    if(dev.outs[num-1] == 0) dev.outsReq[num-1] = 1;
    if(dev.outs[num-1] == 1) dev.outsReq[num-1] = 0;
    sendMsg("setOutputs");
  }
}
function handleModeKey() {
  dev.outsReq = [...dev.outs];
  if("dolewanie" != dev.mode){
    if("auto" == dev.mode) dev.outsReq[4] = 1;
    else dev.outsReq[4] = 0;
      sendMsg("setOutputs");
  }
}
function getDolejSettings() {
  let dolejList = document.querySelectorAll('.dolewanie');
  for(let i = 0; i < dolejList.length; i++){
    dev.dolej[i] = dolejList[i].valueAsNumber;
  }
}
function handleDolejKey() {
  dev.outsReq = [...dev.outs];
  if(dev.mode == "dolewanie"){
    dev.outsReq[4] = 0;  //automat
  }
  else{
    dev.outsReq[4] = 2;  //dolewanie
    sendMsg("dolej");
  }

  sendMsg("setOutputs");
}


function sendToSocket(msg) {
  console.log(JSON.stringify(msg));
  if(isOnESP8266) Socket.send(JSON.stringify(msg));
}


function dayClick() {
  if(this.id == "dayCodzien"){
    let dayList = document.querySelectorAll('.btnDay');
    for(let i = 1; i < dayList.length; i++){
      dayList[i].classList.add("btnDayActiv");
    }
  }
  else{
    this.classList.toggle("btnDayActiv");
  }
}
function addClick() {
  mainWindow.style.display = "none";
  addWindow.style.display = "flex";
  dev.activeLine = this.id.replace("dodaj", "");;
  addHeading.innerText = 'Dodaj nastawę dla sekcji '+dev.activeLine+':';
}
function validateSetting() {
  let time = document.getElementById("setTime").valueAsNumber;
  let duration = document.getElementById("setDuration").valueAsNumber;
  let minute = (time/60000)%60;
  let hour = ((time/60000)-minute)/60;
  let days = 0;

  console.log(hour, minute);

  let dayList = document.querySelectorAll('.btnDay');
  for(let i = 1; i < dayList.length; i++){
    if(dayList[i].classList.contains('btnDayActiv')) days+= 0x01<<(i-1);
  }
  let timeOk = false;
  if((minute>=0)&&(minute<60)&&(hour>=0)&&(hour<24)) timeOk = true;
  if((duration>0)&&(duration<31)&&(timeOk)&&(days>0)){
    let lineName = document.getElementById("line"+dev.activeLine)
    if (dev["line"+dev.activeLine].length<dev.maxRecord) {
      dev["line"+dev.activeLine].push([hour, minute, duration, days]);
      addItem([hour, minute, duration, days], lineName);
      mainWindow.style.display = "flex";
      addWindow.style.display = "none";
    }

  }
}

function addItem(tab, line) {
  let divWpis=document.createElement("div");
  let divCzas=document.createElement("div");
  let divDni=document.createElement("div");
  let divBtn=document.createElement("button");
  let txt = "";

  // if()
  if((tab[3] & 0x07F) == 0x7F){
    txt = 'Codziennie ';
  }
  else {
    if(tab[3] & 0x01) txt += 'Pn ';
    if(tab[3] & 0x02) txt += 'Wt ';
    if(tab[3] & 0x04) txt += 'Śr ';
    if(tab[3] & 0x08) txt += 'Cz ';
    if(tab[3] & 0x10) txt += 'Pt ';
    if(tab[3] & 0x20) txt += 'So ';
    if(tab[3] & 0x40) txt += 'Nd ';
  }
  // divItem.innerText=tab[0]+', '+tab[1]+' min,\t'+txt.slice(0, -1);

  divWpis.className="wpis";
  divCzas.className="wpisTxt1";
  divDni.className="wpisTxt2";
  divCzas.innerText=timeFormat(tab[0], tab[1])+'\xa0\xa0\xa0\xa0'+tab[2]+' min';
  divDni.innerText=txt.slice(0, -1);

  divBtn.innerText="X";
  divBtn.className="btnDelete";
  divBtn.onclick=deleteItem;
  // divItem.appendChild(divBtn);
  divWpis.appendChild(divCzas);
  divWpis.appendChild(divDni);
  divWpis.appendChild(divBtn);
  line.appendChild(divWpis);
  // line.appendChild(divItem1);
}

function timeFormat(hour, minute) {
  txt = "";
  if(hour<10) txt+='0';
  txt+=hour;
  txt+=':';
  if(minute<10) txt+='0';
  txt+=minute;
  return txt;
}

function deleteItem() {
  console.log(Array.from(this.parentElement.parentElement.children));
const index = Array.from(this.parentElement.parentElement.children).indexOf(this.parentElement);
let lineName = this.parentNode.parentNode.id;
console.log(index);
console.log(lineName);
dev[lineName].splice(index, 1);
this.parentNode.parentNode.removeChild(this.parentNode);
}

function clearLine(line) {
  const myNode = document.getElementById("line" + line);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
}

function updateLine(line) {
  clearLine(line);
  for (x in dev['line'+line]) {
    addItem(dev['line'+line][x], document.getElementById('line'+line));
  }
}

function updateDolej() {
  for (let i = 0; i < 5; i++) {
    document.getElementById("Dolej"+(i+1)).value = dev.dolej[i];
  }
}

function showSettings() {
  for (x in dev.line1) {
    addItem(dev.line1[x], document.getElementById("line1"));
  }
  for (x in dev.line2) {
    addItem(dev.line2[x], document.getElementById("line2"));
  }
  for (x in dev.line3) {
    addItem(dev.line3[x], document.getElementById("line3"));
  }
  for (x in dev.line4) {
    addItem(dev.line4[x], document.getElementById("line4"));
  }
  mainWindow.style.display = "flex";
}
