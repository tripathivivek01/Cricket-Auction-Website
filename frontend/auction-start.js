document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const auctionId = params.get("auctionId");

  // Load data
  const auctionData = JSON.parse(localStorage.getItem(auctionId) || "{}");
  const allPlayers = JSON.parse(localStorage.getItem('players_' + auctionId) || "[]");
  const teams = JSON.parse(localStorage.getItem('teams_' + auctionId) || "[]");
  const purseLimit = Number(auctionData.purseLimit) || 0;
  const ROLE_PRIORITY = ["Batsman", "All Rounder", "Bowler", "Wicket Keeper Batsman"];

  const titleEl = document.getElementById("auctionTitle");
  if (titleEl) titleEl.textContent = auctionData.name || "Auction";
  const teamCountDisp = document.getElementById("teamCountDisp");
  if (teamCountDisp) teamCountDisp.textContent = teams.length;

  // ---------- STATE RESTORE / INIT ----------

  // Per player status: "pending" | "sold" | "unsold"
  let playerStatus = JSON.parse(localStorage.getItem('playerStatus_' + auctionId) || "{}");
  allPlayers.forEach(pl => {
    if (!playerStatus[pl.name]) playerStatus[pl.name] = "pending";
  });

  let globalState = JSON.parse(localStorage.getItem('auctionState_' + auctionId) || "{}");
  let mode = globalState.mode || "pending";          // "pending" (normal) or "unsold" (repeat)
  let indexInQueue = globalState.indexInQueue || 0;
  let soldPlayers = globalState.soldPlayers || [];
  let auctionOver = globalState.auctionOver || false;

  let teamPurses = Array.isArray(globalState.teamPurses) &&
                   globalState.teamPurses.length === teams.length
    ? globalState.teamPurses
    : teams.map(() => purseLimit);

  let bidAmount = 0;
  let biddingTeamIdx = null;
  let auctionStarted = false;

  // Build queue from status + mode
  function buildQueueFromStatus(currentMode) {
    const target = currentMode === "unsold" ? "unsold" : "pending";
    // we do not modify playerStatus here; just derive
    return allPlayers.filter(pl => playerStatus[pl.name] === target);
  }

  let queue = buildQueueFromStatus(mode);

  function saveAllState() {
    localStorage.setItem('playerStatus_' + auctionId, JSON.stringify(playerStatus));
    localStorage.setItem('auctionState_' + auctionId, JSON.stringify({
      mode,
      indexInQueue,
      soldPlayers,
      auctionOver,
      teamPurses
    }));
  }

  // ---------- UI HELPERS ----------

  function showOrderSelect() {
    const box = document.getElementById('auctionOrderSelectBox');
    if (box) box.style.display = '';
  }
  function hideOrderSelect() {
    const box = document.getElementById('auctionOrderSelectBox');
    if (box) box.style.display = 'none';
  }

  function showEndAuctionMsg() {
    const card = document.getElementById('auctionPlayerCard');
    if (card) {
      card.innerHTML = `<div class="text-3xl mt-20 font-extrabold text-center text-yellow-400">
        AAB MILTE HAI GROUND ME <br> BEST OF LUCK
      </div>`;
    }
    const controls = document.getElementById('bidControls');
    if (controls) controls.style.display = 'none';
    const teamsRow = document.getElementById('teamsRow');
    if (teamsRow) teamsRow.innerHTML = '';
    const bidInfo = document.getElementById('bidInfo');
    if (bidInfo) bidInfo.innerHTML = '';
    auctionOver = true;
    saveAllState();
  }

  const endAuctionBtn = document.getElementById('endAuctionBtn');
  if (endAuctionBtn) {
    endAuctionBtn.onclick = showEndAuctionMsg;
  }

  function getCurrentPlayer() {
    return queue[indexInQueue] || null;
  }

  function updateStatusCounts() {
    const soldTabBtn = document.getElementById('soldTabBtn');
    const unsoldTabBtn = document.getElementById('unsoldTabBtn');
    const availableTabBtn = document.getElementById('availableTabBtn');
    if (soldTabBtn) soldTabBtn.textContent = `Sold ${soldPlayers.length}`;
    const unsCount = Object.values(playerStatus).filter(s => s === "unsold").length;
    if (unsoldTabBtn) unsoldTabBtn.textContent = `Unsold ${unsCount}`;
    const availCount = queue.length - indexInQueue;
    if (availableTabBtn) availableTabBtn.textContent = `Available ${availCount}`;
    if (teamCountDisp) teamCountDisp.textContent = teams.length;
  }

  function showPlayersModal(tab) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modal = document.getElementById('playersModal');
    if (!modalTitle || !modalContent || !modal) return;

    let data = [];
    let title = "";
    if (tab === 'sold') {
      data = soldPlayers;
      title = "Sold Players";
    } else if (tab === 'unsold') {
      title = "Unsold Players";
      data = allPlayers.filter(pl => playerStatus[pl.name] === "unsold");
    } else {
      title = "Available Players";
      data = queue.slice(indexInQueue);
    }
    modalTitle.textContent = title;

    let html = "";
    if (tab === "sold") {
      html = data.map(pl => `
        <div class="flex items-center gap-4 my-2">
          <img src="${pl.photo}" class="w-12 h-12 rounded-full object-cover border-2 border-yellow-300">
          <div>
            <div class="font-bold text-lg">${pl.name}</div>
            <div class="text-gray-700">Sold In - <span class="font-bold text-red-800">${pl.soldTo || '-'}</span></div>
            <div class="text-yellow-900 font-bold">₹${pl.finalBid || pl.basePrice}</div>
          </div>
        </div>`).join('');
    } else {
      html = data.map(pl => `
        <div class="flex items-center gap-4 my-2">
          <img src="${pl.photo}" class="w-12 h-12 rounded-full object-cover border-2 border-yellow-300">
          <div>
            <div class="font-bold text-lg">${pl.name}</div>
            <div class="text-gray-600">Role: ${pl.role}</div>
            <div class="text-gray-600">Base Price: ₹${pl.basePrice || 0}</div>
          </div>
        </div>`).join('');
    }

    modalContent.innerHTML = html || "<div class='px-2 py-6 text-center text-gray-400 font-semibold'>No players in this section yet.</div>";
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.onclick = function () {
      const modal = document.getElementById('playersModal');
      if (modal) modal.classList.add("hidden");
      document.body.style.overflow = "";
    };
  }
  const soldTabBtn = document.getElementById('soldTabBtn');
  const unsoldTabBtn = document.getElementById('unsoldTabBtn');
  const availableTabBtn = document.getElementById('availableTabBtn');
  if (soldTabBtn) soldTabBtn.onclick = () => showPlayersModal('sold');
  if (unsoldTabBtn) unsoldTabBtn.onclick = () => showPlayersModal('unsold');
  if (availableTabBtn) availableTabBtn.onclick = () => showPlayersModal('available');

  // Teams row
  function renderTeamsRow() {
    const teamsRow = document.getElementById('teamsRow');
    if (!teamsRow) return;

    let html = '';
    teams.forEach((team, idx) => {
      let purseDisplay = teamPurses[idx] !== undefined ? teamPurses[idx] : purseLimit;
      html += `
        <div class="p-4 flex-1 min-w-[200px] max-w-[240px] bg-gray-900 rounded-lg shadow text-center cursor-pointer border-2 ${biddingTeamIdx===idx ? 'border-yellow-400' : 'border-transparent'} mx-2 team-bid-card" data-teamidx="${idx}">
          <img src="${team.icon}" class="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-yellow-300" />
          <div class="font-bold text-yellow-300 text-lg">${team.name}</div>
          <div class="text-green-400 text-base font-bold">Purse Left: ₹${purseDisplay}</div>
        </div>`;
    });
    teamsRow.innerHTML = html;

    document.querySelectorAll('.team-bid-card').forEach(div => {
      div.onclick = function () {
        biddingTeamIdx = Number(div.getAttribute('data-teamidx'));
        renderTeamsRow();
        renderBidInfo();
      };
    });
  }

  function renderCurrentPlayer() {
    const card = document.getElementById('auctionPlayerCard');
    const controls = document.getElementById('bidControls');
    const bidInfo = document.getElementById('bidInfo');
    const current = getCurrentPlayer();

    if (!current) {
      // If no player in this mode: if we are in pending, switch to unsold mode if any unsold exist
      const hasUnsold = Object.values(playerStatus).includes("unsold");
      if (mode === "pending" && hasUnsold && !auctionOver) {
        mode = "unsold";
        queue = buildQueueFromStatus("unsold");
        indexInQueue = 0;
        saveAllState();
        renderCurrentPlayer();
        return;
      }
      // If still empty in unsold or no unsold: wait for End Auction
      if (controls) controls.style.display = 'none';
      if (card) card.innerHTML = '';
      const teamsRow = document.getElementById('teamsRow');
      if (teamsRow) teamsRow.innerHTML = '';
      if (bidInfo) bidInfo.innerHTML = '';
      showOrderSelect();
      return;
    }

    if (card) {
      card.innerHTML = `
        <div class="flex flex-col items-center">
          <img src="${current.photo}" class="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 mb-4">
          <div class="font-extrabold text-2xl text-yellow-400">${current.name}</div>
          <div class="text-gray-200 text-lg my-2">Age: ${current.age}</div>
          <div class="text-gray-300 text-lg">Role: ${current.role}</div>
          <div class="text-green-400 text-xl mt-2 font-bold">Base Price: ₹${current.basePrice || 0}</div>
        </div>
      `;
    }
  }

  function renderBidInfo() {
    const bidInfo = document.getElementById('bidInfo');
    if (!bidInfo) return;
    const current = getCurrentPlayer();
    if (!current) return;
    let str = `Current Bid: ₹${bidAmount} `;
    if (biddingTeamIdx !== null) {
      str += `| by <span class="text-yellow-300 font-bold">${teams[biddingTeamIdx].name}</span>`;
    }
    bidInfo.innerHTML = `<span class="text-2xl text-yellow-300">${current.name}</span> | ${str}`;
  }

  function getBidStep(pl) {
    const role = (pl.role || "").trim();
    if (role === "Batsman") return Number(auctionData.batsmanBidIncrease) || 100;
    if (role === "Bowler") return Number(auctionData.bowlerBidIncrease) || 100;
    if (role === "All Rounder") return Number(auctionData.allRounderBidIncrease) || 100;
    return 100;
  }

  // Move to next player in current mode
  function goToNextPlayer() {
    indexInQueue++;
    if (indexInQueue >= queue.length) {
      // end of this mode -> if we just finished pending we’ll jump to unsold when renderCurrentPlayer is called
      indexInQueue = 0;
      queue = buildQueueFromStatus(mode); // keep consistent
    }
    saveAllState();
    renderCurrentPlayer();
    renderBidInfo();
  }

  const bidUpBtn = document.getElementById('bidUpBtn');
  const bidDownBtn = document.getElementById('bidDownBtn');
  const soldBtn = document.getElementById('soldBtn');
  const unsoldBtn = document.getElementById('unsoldBtn');

  if (bidUpBtn) {
    bidUpBtn.onclick = function () {
      if (!auctionStarted || auctionOver) return;
      if (biddingTeamIdx === null) {
        alert("Select a team first to bid!");
        return;
      }
      const pl = getCurrentPlayer();
      if (!pl) return;
      const thisBase = Number(pl.basePrice) || 0;
      const step = getBidStep(pl);
      if (bidAmount === 0) bidAmount = thisBase;
      else bidAmount += step;
      if (bidAmount > teamPurses[biddingTeamIdx]) {
        bidAmount -= step;
        alert("Selected team doesn't have enough purse!");
        return;
      }
      renderBidInfo();
      saveAllState();
    };
  }

  if (bidDownBtn) {
    bidDownBtn.onclick = function () {
      if (!auctionStarted || biddingTeamIdx === null) return;
      const pl = getCurrentPlayer();
      if (!pl) return;
      const thisBase = Number(pl.basePrice) || 0;
      const step = getBidStep(pl);
      if (bidAmount - step >= thisBase) {
        bidAmount -= step;
        renderBidInfo();
        saveAllState();
      }
    };
  }

  if (soldBtn) {
    soldBtn.onclick = function () {
      if (!auctionStarted || auctionOver) return;
      if (biddingTeamIdx === null || bidAmount === 0) {
        alert("Please bid and select a team before selling.");
        return;
      }
      const pl = getCurrentPlayer();
      if (!pl) return;

      playerStatus[pl.name] = "sold";
      pl.soldTo = teams[biddingTeamIdx].name;
      pl.finalBid = bidAmount;
      soldPlayers.push(pl);
      teamPurses[biddingTeamIdx] -= bidAmount;

      // Save per-team for view-auction page
      const teamKey = 'soldPlayers_' + auctionId + '_' + teams[biddingTeamIdx].name;
      const list = JSON.parse(localStorage.getItem(teamKey) || "[]");
      list.push(pl);
      localStorage.setItem(teamKey, JSON.stringify(list));

      bidAmount = 0;
      biddingTeamIdx = null;

      queue = buildQueueFromStatus(mode);
      saveAllState();
      renderTeamsRow();
      updateStatusCounts();
      goToNextPlayer();
    };
  }

  if (unsoldBtn) {
    unsoldBtn.onclick = function () {
      if (!auctionStarted || auctionOver) return;
      const pl = getCurrentPlayer();
      if (!pl) return;
      playerStatus[pl.name] = "unsold";
      bidAmount = 0;
      biddingTeamIdx = null;

      queue = buildQueueFromStatus(mode);
      saveAllState();
      renderTeamsRow();
      updateStatusCounts();
      goToNextPlayer();
    };
  }

  function startAuction() {
    if (auctionOver) {
      alert("THE AUCTION IS OVER");
      return;
    }
    auctionStarted = true;
    const controls = document.getElementById('bidControls');
    if (controls) controls.style.display = '';
    updateStatusCounts();
    saveAllState();
    renderTeamsRow();
    renderCurrentPlayer();
    renderBidInfo();
  }

  // ORDER SELECTION
  showOrderSelect();
  const sequenceBtn = document.getElementById('sequenceBtn');
  const categoryBtn = document.getElementById('categoryBtn');

  if (sequenceBtn) {
    sequenceBtn.onclick = function () {
      if (auctionOver) {
        alert("THE AUCTION IS OVER");
        return;
      }
      hideOrderSelect();

      // Build queue for current mode without sorting
      queue = buildQueueFromStatus(mode);
      indexInQueue = 0;
      startAuction();
    };
  }

  if (categoryBtn) {
    categoryBtn.onclick = function () {
      if (auctionOver) {
        alert("THE AUCTION IS OVER");
        return;
      }
      hideOrderSelect();

      // Category-wise queue
      const baseQueue = buildQueueFromStatus(mode);
      queue = [];
      ROLE_PRIORITY.forEach(role => {
        queue = queue.concat(baseQueue.filter(pl => (pl.role || "").trim() === role));
      });
      queue = queue.concat(
        baseQueue.filter(pl => !ROLE_PRIORITY.includes((pl.role || "").trim()))
      );
      indexInQueue = 0;
      startAuction();
    };
  }

  // Auto-resume if mid-auction and not over
  if (!auctionOver && (Object.values(playerStatus).some(s => s !== "pending"))) {
    hideOrderSelect();
    queue = buildQueueFromStatus(mode);
    startAuction();
  }

  // If already over
  if (auctionOver) {
    showEndAuctionMsg();
    showOrderSelect();
    if (sequenceBtn) sequenceBtn.onclick = () => alert("THE AUCTION IS OVER");
    if (categoryBtn) categoryBtn.onclick = () => alert("THE AUCTION IS OVER");
  }
});
