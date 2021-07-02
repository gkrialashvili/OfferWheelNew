"use strict";

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

(function () {
  var POINTS_LIMIT = 500;

  var FULL_ROTATION = 360;

  var remainingSlotSpins = 0;
  var remainingSportSpins = 0;

  var SPORT_WHEEL_ID = 4;
  var SLOT_WHEEL_ID = 5;

  var MAX = {
    0: 5000,
    1: 1000,
  };

  var errorMessage = {
    ge: "დაფიქსირდა შეცდომა ცადეთ მოგვიანებით",
    en: "SORRY, THERE IS A PROBLEM PLEASE TRY LATER",
    ru: "EGT фриспинов",
  };

  var giftTypes = {
    "5burninghotfs": {
      ge: "EGT ფრისპინი",
      en: "EGT freespins",
      ru: "попробуй позже",
    },
    freebet: {
      ge: "₾ ფრიბეთი",
      en: "₾ freebet",
      ru: "₾ фрибетов",
    },
    bonus: {
      ge: "ფრისპინი და ერთი უფასო დატრიალება",
      en: "FREESPINS AND 1 FREE SPIN OF THE WHEEL",
      ru: "ФРИСПИНОВ И 1 БЕСПЛАТНОЕ ВРАЩЕНИЕ КОЛЕСА",
    },
    bonusFreebet: {
      ge: "₾ ფრიბეთი და ბორბლის 1 უფასო დატრიალება",
      en: "₾ FREEBETS AND 1  FREE SPIN OF THE WHEEL",
      ru: "₾ ФРИБЕТОВ И 1 БЕСПЛАТНОЕ ВРАЩЕНИЕ КОЛЕСА",
    },
    gel: "&#8382;",
  };

  var slotPrizes = new Map([
    [1, 240],
    [2, 40],
    [3, 120],
    [4, 320],
    [5, 280],
    [6, 80],
    [7, 200],
    [8, 160],
    [9, 0],
  ]);

  var sportPrizes = new Map([
    [1, 30],
    [2, 330],
    [3, 240],
    [4, 90],
    [5, 150],
    [6, 210],
    [7, 300],
    [8, 60],
    [9, 270],
    [10, 120],
    [11, 180],
    [12, 360],
  ]);

  var leastPercantage = new Map([
    [1, 0],
    [2, 20],
    [3, 40],
    [4, 60],
    [5, 80],
  ]);

  var slotSpinsByLevel = {
    50: 1,
    250: 2,
    500: 3,
    2500: 4,
    5000: 5,
  };

  var sportSpinsBylevel = {
    5: 1,
    20: 2,
    50: 3,
    200: 4,
    500: 5,
    1000: 6,
  };

  var wheelTypes = {
    SLOT: "slots",
    SPORT: "sport",
  };

  var spinsUsedUp = {
    SLOT: 0,
    SPORT: 0,
  };

  window.onload = function () {
    reformatURLS();

    var userInfo = readParams();

    getUserData(userInfo);
    addListeners(userInfo);

    document.querySelector(".bt-bb").addEventListener("click", function () {
      return getSlotHistory(userInfo);
    });

    document
      .querySelector(".bt-bb.sport")
      .addEventListener("click", function () {
        return getSportHistory(userInfo);
      });

    setBarsInitial();
  };

  function reformatURLS() {
    var langSwitches = Array.from(
      document.querySelectorAll(".lang.w-nav-link")
    );
    var params = window.location.href.split("?")[1];
    langSwitches.forEach(function (item) {
      return (item.href += "?" + params);
    });
  }

  function setBarsInitial() {
    var fullers = document.querySelectorAll(".progress_line");

    fullers.forEach(function (node) {
      node.innerHTML = "";
      var segments = [
        createSegment("0"),
        createSegment("25%"),
        createSegment("50%"),
        createSegment("75%"),
      ];

      node.append.apply(node, segments);
    });
  }

  function createSegment(leftOffset) {
    var seg = document.createElement("div");
    seg.style.position = "absolute";
    seg.style.height = "10px";
    seg.style.width = "25%";
    seg.style.left = leftOffset;

    var filler = document.createElement("div");
    filler.style.height = "10px";

    seg.appendChild(filler);
    return seg;
  }

  function addListeners(userData) {
    var _dropOldEvents = dropOldEvents(getSpinBtns());

    var slotSpinner = _dropOldEvents.slotSpinner;
    var sportSpinner = _dropOldEvents.sportSpinner;

    var _getWheels = getWheels();

    var slotWheel = _getWheels.slotWheel;
    var sportWheel = _getWheels.sportWheel;

    slotSpinner.addEventListener("click", function () {
      if (remainingSlotSpins !== 0) {
        draw(userData, SLOT_WHEEL_ID, slotWheel);
      }
    });

    sportSpinner.addEventListener("click", function () {
      if (remainingSportSpins !== 0) {
        draw(userData, SPORT_WHEEL_ID, sportWheel);
      }
    });
  }

  function dropOldEvents(btns) {
    var slotSpinner = btns.slotSpinner;
    var sportSpinner = btns.sportSpinner;

    return {
      slotSpinner: cloneNode(slotSpinner),
      sportSpinner: cloneNode(sportSpinner),
    };
  }

  function cloneNode(node) {
    var parent = node.parentNode;
    var newBtn = node.cloneNode(true);
    node.remove();
    parent.appendChild(newBtn);
    return newBtn;
  }

  function getUserData(userData) {
    // slots
    getSlotData(userData);
    // sports
    getSportData(userData);
  }

  function getSlotData(userData) {
    fetch("https://cms.crocobet.com/campaigns/daily-slot-wheel-080221/user", {
      headers: {
        "X-ODDS-SESSION": userData.xOdds,
      },
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        var slotSpinner = getSpinBtns().slotSpinner;
        if (res && res["data"] && res["data"]["metadata"]) {
          var userInfo = res.data.metadata;
          var pointAmount = userInfo.points % 5000;
          var level = userInfo.levels[userInfo.unlockedLevel - 1];

          remainingSlotSpins = userInfo.unlockedLevel - userInfo.currentLevel;
          if (remainingSlotSpins < 0) {
            remainingSlotSpins = 0;
          }

          getLabels().slotLbl.innerHTML = remainingSlotSpins;

          var basePoints = userInfo.levels[userInfo.unlockedLevel - 1] || 0;
          var nextPoints =
            userInfo.levels[userInfo.unlockedLevel] ||
            userInfo.levels[userInfo.levels.length - 1];
          var extraPoints = pointAmount - basePoints;
          var extraPercentage =
            (extraPoints / Math.max(nextPoints - basePoints, 1)) * 100;

          drawBar(
            userInfo.unlockedLevel,
            extraPercentage,
            0,
            pointAmount,
            userInfo.currentLevel
          );

          if (remainingSlotSpins !== 0) {
            slotSpinner.classList.add("active");
          }
        }
      })
      .catch(function (err) {
        console.error("BONUS-WHEEL-ERROR: ", err);
      });
  }

  function getSportData(userData) {
    fetch("https://cms.crocobet.com/campaigns/sport-wheel-1502/user", {
      headers: {
        "X-ODDS-SESSION": userData.xOdds,
      },
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        var sportSpinner = getSpinBtns().sportSpinner;
        if (res && res["data"] && res["data"]["metadata"]) {
          var userInfo = res.data.metadata;
          var pointAmount = userInfo.points % 5000;
          var level = userInfo.levels[userInfo.unlockedLevel - 1];

          remainingSportSpins = userInfo.unlockedLevel - userInfo.currentLevel;
          if (remainingSportSpins < 0) {
            remainingSportSpins = 0;
          }

          getLabels().sportLbl.innerHTML = remainingSportSpins;

          var basePoints = userInfo.levels[userInfo.unlockedLevel - 1] || 0;
          var nextPoints =
            userInfo.levels[userInfo.unlockedLevel] ||
            userInfo.levels[userInfo.levels.length - 1];
          var extraPoints = userInfo.points - basePoints;
          var extraPercentage =
            (extraPoints / Math.max(nextPoints - basePoints, 1)) * 100;

          drawBar(
            userInfo.unlockedLevel,
            extraPercentage,
            1,
            pointAmount,
            userInfo.currentLevel
          );

          if (remainingSportSpins !== 0) {
            sportSpinner.classList.add("active");
          }
        }
      })
      .catch(function (err) {
        console.error("ERROR: ", err);
      });
  }

  function drawBar(
    segment,
    percentageInSegment,
    barNum,
    points,
    currentProgressNum,
    filled
  ) {
    var line = document.querySelectorAll(".progress_line")[barNum];
    var barColor = barNum === 0 ? "#4963d7" : "#03b730";

    var segments = line.children;
    var currentSegment = 0;

    while (currentSegment < segment) {
      var curr = segments[currentSegment].children[0];
      curr.style.width = "100%";
      curr.style.background = barColor;
      currentSegment++;
    }

    if (currentSegment !== 0 && segments[currentSegment]) {
      var next = segments[currentSegment].children[0];
      next.style.width = percentageInSegment + "%";
      next.style.background = barColor;
    }

    var cursor = document.querySelectorAll(".ind_wrp")[barNum];
    var filledSegments = currentSegment * 25;
    var cursorIncrementInSegment = (percentageInSegment * 25) / 100;
    var zeroInSegment = currentSegment === 6;
    cursor.style.left =
      currentSegment === 0
        ? "0"
        : "calc(" +
          filledSegments +
          "% + " +
          (!zeroInSegment ? cursorIncrementInSegment : 0) +
          "%)";

    var cursorLbl = document.getElementById(
      barNum === 0 ? "slot_prgs" : "sport_prgrs"
    );
    cursorLbl.innerHTML =
      (zeroInSegment ? MAX[barNum] : Math.floor(points)) + " &#8382;";

    var progressGrid = document.querySelectorAll(".prize_grid")[barNum];

    var progressPts = []
      .concat(_toConsumableArray(progressGrid.children))
      .filter(function (child) {
        return child.classList.contains("progress_point");
      });

    progressPts.forEach(function (pt) {
      pt.classList.remove("active");
      pt.children[0].classList.remove(barNum === 0 ? "active-b" : "active");
    });

    if (currentSegment !== 0) {
      for (var i = 0; i < segment; i++) {
        progressPts[i].classList.add("active");
        progressPts[i].children[0].classList.add(
          barNum === 0 ? "active-b" : "active"
        );
      }
    }
  }

  // Draw
  function draw(userData, wheelId, wheel) {
    var WHEEL_ID = wheelId;
    fetch("https://cms.crocobet.com/campaigns/sport-wheel-1502/get-prize", {
      method: "POST",
      headers: {
        "X-ODDS-SESSION": userData.xOdds,
      },
    })
      .then(function (r) {
        if (r.ok) return r.json();
        else throw new Error("დაფიქსირდა შეცდომა სცადეთ მოგვიანებით");
      })
      .then(function (res) {
        var _getSpinBtns = getSpinBtns();

        var slotSpinner = _getSpinBtns.slotSpinner;
        var sportSpinner = _getSpinBtns.sportSpinner;

        if (WHEEL_ID === SLOT_WHEEL_ID) {
          (function () {
            var prize = res.data.prize;
            var prizeWon = prize.amount;
            var prizeId = prize.id;
            var prizeType = prize.type;
            if (remainingSlotSpins) {
              spinTheWheel(wheel, prizeId, WHEEL_ID);
              remainingSlotSpins--;

              setTimeout(function () {
                openGiftPopup(prizeWon, prizeType);
              }, 5200);

              // update
              getLabels().slotLbl.innerHTML = remainingSlotSpins;
              if (remainingSlotSpins === 0) {
                slotSpinner.classList.remove("active");
              }
            }
          })();
        } else if (WHEEL_ID === SPORT_WHEEL_ID) {
          (function () {
            var prize = res.data.prize;
            var prizeWon = prize.amount;
            var prizeId = prize.id;
            var prizeType = prize.type;
            var prizeBonus = prize.bonus;
            if (remainingSportSpins) {
              spinTheWheel(wheel, prizeId, WHEEL_ID);
              remainingSportSpins--;

              if (prizeType !== "5burninghotfs") {
                document.querySelectorAll(".text-block-640")[0].innerHTML = "";
              }
              setTimeout(function () {
                openGiftPopup(prizeWon, prizeType, prizeBonus);
              }, 5200);

              // update
              getLabels().sportLbl.innerHTML = remainingSportSpins;
              if (remainingSportSpins === 0) {
                sportSpinner.classList.remove("active");
              }
            }
          })();
        }
      })
      .catch(function (err) {
        console.error("ERROR: ", err);
        var Error = errorMessage[langToken];
        showErrorModal(Error);
      });
  }

  function spinTheWheel(wheelRef, id, wheelId) {
    var rndSpins = Math.floor(3 + Math.random());
    var angleOnWheel =
      wheelId === SLOT_WHEEL_ID ? slotPrizes.get(id) : sportPrizes.get(id);
    var rotAmount = FULL_ROTATION * rndSpins + angleOnWheel;
    wheelRef.style.transition = "all 5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s";
    wheelRef.style.transform = "rotate(" + rotAmount + "deg)";
  }

  function openGiftPopup(prizeAmount, prizeLabel, prizeBonus) {
    var giftModal = document.querySelector(".popup-frsp");
    var prizeLbl = document.getElementById("frsp");
    var gifCongrats = document.querySelector(".text-block-638");
    giftModal.classList.remove("hide");
    var langToken = getLangToken();

    if (prizeLabel === "5burninghotfs") {
      document.getElementById("popPlayWeb").href =
        "https://www.crocobet.com/#/slots?menu=egt&provider=egt&slot=burninghot";
      document.getElementById("popPlayMob").href =
        "https://m.crocobet.com/#/slots?provider=egt&provider=egt&slot=burninghot";
    } else if (prizeLabel === "freebet") {
      document.getElementById("popPlayWeb").href =
        "https://www.crocobet.com/#/sports/prematch";
      document.getElementById("popPlayMob").href =
        "https://www.crocobet.com/#/sports/prematch";
    }

    if (prizeBonus === true && prizeAmount === 10) {
      var prize =
        prizeLabel === "gel" ? giftTypes : giftTypes["bonus"][langToken];
      gifCongrats.style.display = "none";
      document.querySelector(".text-block-639").style.marginTop = "110px";
    } else if (prizeBonus === true && prizeAmount === 5) {
      var prize =
        prizeLabel === "gel" ? giftTypes : giftTypes["bonusFreebet"][langToken];
      gifCongrats.style.display = "none";
      document.querySelector(".text-block-639").style.marginTop = "110px";
    } else {
      var prize =
        prizeLabel === "gel" ? giftTypes : giftTypes[prizeLabel][langToken];
      gifCongrats.style.display = "block";
      document.querySelector(".text-block-639").style.marginTop = "10px";
      document.querySelector(".text-block-638").style.marginTop = "100px";
    }

    prizeLbl.innerHTML = prizeAmount + (" " + prize);

    listenForPopupQuit();
  }

  function getLangToken() {
    var url = window.location.href;
    var baseUrl = url.split("?")[0];
    var urlSegments = baseUrl.split("/");
    return urlSegments[urlSegments.length - 2].split(".")[0];
  }

  function listenForPopupQuit() {
    var giftPopupCloseBtn = document.querySelector(".close_pop");
    giftPopupCloseBtn.addEventListener("click", function (e) {
      resetWheelSpin();
      e.target.style.cursor = "pointer";
      e.target.parentElement.classList.add("hide");
    });
  }

  function resetWheelSpin() {
    var _getWheels2 = getWheels();

    var slotWheel = _getWheels2.slotWheel;
    var sportWheel = _getWheels2.sportWheel;

    [slotWheel, sportWheel].forEach(function (wheel) {
      wheel.style.transition = "";
      wheel.style.transform = "";
    });
  }

  function getSlotHistory(userData) {
    fetch(
      "https://cms.crocobet.com/campaigns/daily-slot-wheel-080221/history",
      {
        headers: {
          "X-ODDS-SESSION": userData.xOdds,
        },
      }
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (historyData) {
        if (historyData && historyData["data"]) {
          var historyItems = historyData["data"].map(function (historyItem) {
            return {
              time: historyItem.createdAt,
              prize: {
                amount: historyItem.prize.amount,
                type: historyItem.prize.type,
                bonus: historyItem.prize.bonus,
              },
            };
          });

          updateHistoryList(historyItems, SLOT_WHEEL_ID);
        }
      });
  }

  function getSportHistory(userData) {
    fetch("https://cms.crocobet.com/campaigns/sport-wheel-1502/history", {
      headers: {
        "X-ODDS-SESSION": userData.xOdds,
      },
    })
      .then(function (r) {
        if (r.ok) return r.json();
        else throw new Error();
      })
      .then(function (historyData) {
        if (historyData && historyData["data"]) {
          var historyItems = historyData["data"].map(function (historyItem) {
            return {
              time: historyItem.createdAt,
              prize: {
                amount: historyItem.prize.amount,
                type: historyItem.prize.type,
                bonus: historyItem.prize.bonus,
              },
            };
          });

          updateHistoryList(historyItems, SPORT_WHEEL_ID);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function showErrorModal(error) {
    let errorText = document.querySelectorAll("#error-text");
    let errorModal = document.querySelector(".error-modal-container");
    errorText.innerHTML = error;
    errorModal.style.display = "flex";
  }

  document
    .querySelector(".error-modal-container")
    .addEventListener("click", function () {
      let errorModal = document.querySelector(".error-modal-container");
      errorModal.style.display = "none";
    });

  function updateHistoryList(historyItems, wheelId) {
    var containers = document.querySelectorAll("#slotboardsr");
    var container = wheelId === SLOT_WHEEL_ID ? containers[0] : containers[1];

    container.innerHTML = "";

    historyItems.forEach(function (item) {
      var date = new Date(item.time);
      var hItem = document.createElement("div");
      hItem.classList.add("borbal_lb_content");

      if (wheelId === SPORT_WHEEL_ID) hItem.classList.add("sport");

      var timeLbl = document.createElement("div");
      var prizeLbl = document.createElement("div");
      timeLbl.classList.add("lb_date");
      prizeLbl.classList.add("lb_prize");
      timeLbl.innerHTML =
        prependZero(date.getDate()) + "." + prependZero(date.getMonth() + 1);
      var langToken = getLangToken();
      if (item.prize.bonus === true && item.prize.amount === 10)
        prizeLbl.innerHTML =
          item.prize.amount + " " + giftTypes["bonus"][langToken];
      else if (item.prize.bonus === true && item.prize.amount === 5) {
        prizeLbl.innerHTML =
          item.prize.amount + " " + giftTypes["bonusFreebet"][langToken];
      } else
        prizeLbl.innerHTML =
          item.prize.amount + " " + giftTypes[item.prize.type][langToken];

      hItem.appendChild(timeLbl);
      hItem.appendChild(prizeLbl);

      container.appendChild(hItem);
    });
  }

  function determineSegment(amount, lineMarks) {
    var checkpoints = [].concat(_toConsumableArray(lineMarks));
    var segmentCounter = 0;

    for (var i = 0; i < checkpoints.length; i++) {
      if (amount <= checkpoints[i]) return ++segmentCounter;
    }
  }

  function readParams() {
    var params = new URLSearchParams(window.location.search);
    var userId = params.get("id"),
      tk = params.get("tk");

    return { id: userId, xOdds: atob(tk) };
  }

  function getWheels() {
    var wheels = document.querySelectorAll(".wheel_frsp");
    return { slotWheel: wheels[0], sportWheel: wheels[1] };
  }

  function getSpinBtns() {
    var slot = document.getElementById("slotSpinner");
    var sport = document.getElementById("sportSpiner");
    return { slotSpinner: slot, sportSpinner: sport };
  }

  function getCursorLbls() {
    return {
      slotIndicator: document.getElementById("slot_prgs"),
      sportIndicator: document.getElementById("sport_prgrs"),
    };
  }

  function getLabels() {
    return {
      slotLbl: document.getElementById("slot"),
      sportLbl: document.getElementById("sport"),
    };
  }

  function getCashLabels() {
    return {
      slotCash: document.getElementById("slot_cash_amount"),
      sportCash: document.getElementById("sport_cash_amount"),
    };
  }

  function prependZero(num) {
    return num <= 10 ? "0" + num : num;
  }
})();

var dt = new Date();
var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();

function changeImage() {
  $(".bonus_img").toggle();
}
window.setInterval(changeImage, 1500);

const terms = $(".accordion_item_trigger-t");
$(document).ready(function () {
  $(terms).append("<img class='arow' src='images/wheel/arow.png' alt=''>");
  let arrow = $(".arow");
  arrow.first().css("margin-right", "27px");
  arrow.last().css("margin-right", "27px");
});

$(terms).click(function () {
  $(this).children(".arow").toggleClass("rotateThatBitch");
});
