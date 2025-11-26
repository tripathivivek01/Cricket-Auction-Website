document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const auctionId = params.get("auctionId");

  // Load data
  const auctionData = JSON.parse(localStorage.getItem(auctionId)) || {};
  const allPlayers = JSON.parse(localStorage.getItem('players_' + auctionId)) || [];
  const teams = JSON.parse(localStorage.getItem('teams_' + auctionId)) || [];
  const purseLimit = Number(auctionData.purseLimit) || 0;
  const ROLE_PRIORITY = ["Batsman", "All Rounder", "Bowler", "Wicket Keeper Batsman"];
  document.getElementById("auctionTitle").textContent = auctionData.name || "Auction";
  document.getElementById("teamCountDisp").textContent = teams.length;

  // Restore state
  let savedState = JSON.parse(localStorage.getItem('auctionState_' + auctionId) || "{}");
  let soldPlayers = savedState.soldPlayers || [];
  let unsoldPlayers = savedState.unsoldPlayers || [];
  let playerOrder = [];
  let currentIdx = savedState.currentIdx || 0;
  let teamPurses = Array.isArray(savedState.teamPurses) && savedState.teamPurses.length === teams.length ?
    savedState.teamPurses : teams.map(_ => purseLimit);

  let bidAmount = 0;
  let biddingTeamIdx = null;
  let auctionStarted = false;
  let auctionOver = savedState.auctionOver || false;

  // unsold pool cycling
  let unsoldCycle = savedState.unsoldCycle || 0; // repeats (0 at start)
  let nowCyclingUnsold = savedState.nowCyclingUnsold || false;

  // Button visibility and UI utility
  function showOrderSelect() { document.getElementById('auctionOrderSelectBox').style.display = ''; }
  function hideOrderSelect() { document.getElementById('auctionOrderSelectBox').style.display = 'none'; }

  function showEndAuctionMsg() {
    document.getElementById('auctionPlayerCard').innerHTML = `<div class="text-3xl mt-20 font-extrabold text-center text-yellow-400">AAB MILTE HAI GROUND ME <br> BEST OF LUCK</div>`;
    document.getElementById('bidControls').style.display = 'none';
    document.getElementById('teamsRow').innerHTML = '';
    document.getElementById('bidInfo').innerHTML = '';
    auctionOver = true;
    saveAuctionState();
  }

  function saveAuctionState() {
    localStorage.setItem('auctionState_' + auctionId, JSON.stringify({
      currentIdx,
      soldPlayers,
      unsoldPlayers,
      teamPurses,
      auctionOver,
      unsoldCycle,
      nowCyclingUnsold
    }));
  }

  // --- End Auction Button ---
  document.getElementById('endAuctionBtn').onclick = function() {
    showEndAuctionMsg();
  };

  // --- Modal/status/team card logic (as before) ---
  function updateStatusCounts() {
    document.getElementById('soldTabBtn').textContent = `Sold ${soldPlayers.length}`;
    document.getElementById('unsoldTabBtn').textContent = `Unsold ${unsoldPlayers.length}`;
    document.getElementById('availableTabBtn').textContent = `Available ${playerOrder.length - currentIdx}`;
    document.getElementById('teamCountDisp').textContent = teams.length;
  }

  function showPlayersModal(tab) {
    // ...no changes needed (as earlier)...
    let data = [], modalTitle = "";
    if (tab === 'sold') { data = soldPlayers; modalTitle = "Sold Players"; }
    else if (tab === 'unsold') { data = unsoldPlayers; modalTitle = "Unsold Players"; }
    else { data = playerOrder.slice(currentIdx); modalTitle = "Available Players"; }
    document.getElementById('modalTitle').textContent = modalTitle;
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
    document.getElementById('modalContent').innerHTML = html || "<div class='px-2 py-6 text-center text-gray-400 font-semibold'>No players in this section yet.</div>";
    document.getElementById('playersModal').classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  document.getElementById('closeModalBtn').onclick = function(){ document.getElementById('playersModal').classList.add("hidden"); document.body.style.overflow = ""; };
  document.getElementById('soldTabBtn').onclick = () => showPlayersModal('sold');
  document.getElementById('unsoldTabBtn').onclick = () => showPlayersModal('unsold');
  document.getElementById('availableTabBtn').onclick = () => showPlayersModal('available');

  function renderTeamsRow() {
    let teamsHTML = '';
    teams.forEach((team, idx) => {
      let purseDisplay = teamPurses[idx] !== undefined ? teamPurses[idx] : purseLimit;
      teamsHTML += `
        <div class="p-4 flex-1 min-w-[200px] max-w-[240px] bg-gray-900 rounded-lg shadow text-center cursor-pointer border-2 ${biddingTeamIdx===idx ? 'border-yellow-400' : 'border-transparent'} mx-2 team-bid-card" data-teamidx="${idx}">
          <img src="${team.icon}" class="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-yellow-300" />
          <div class="font-bold text-yellow-300 text-lg">${team.name}</div>
          <div class="text-green-400 text-base font-bold">Purse Left: ₹${purseDisplay}</div>
        </div>`;
    });
    document.getElementById('teamsRow').innerHTML = teamsHTML;
    document.querySelectorAll('.team-bid-card').forEach(div => {
      div.onclick = function() { biddingTeamIdx = Number(div.getAttribute('data-teamidx')); renderTeamsRow(); renderBidInfo();}
    });
  }
  function renderCurrentPlayer() {
    let pl = playerOrder[currentIdx];
    if (!pl) {
      // Repeats unsold (cycle) until user ends
      if (unsoldPlayers.length > 0 && !auctionOver) {
        nowCyclingUnsold = true;
        unsoldCycle = (typeof unsoldCycle === "number" ? unsoldCycle : 0) + 1;
        playerOrder = unsoldPlayers.slice();
        currentIdx = 0;
        unsoldPlayers = [];
        bidAmount = 0; biddingTeamIdx = null;
        updateStatusCounts(); saveAuctionState();
        renderTeamsRow(); renderCurrentPlayer(); renderBidInfo();
        return;
      }
      if (auctionOver) {
        showEndAuctionMsg();
        return;
      }
      showOrderSelect();
      document.getElementById('bidControls').style.display = 'none';
      document.getElementById('auctionPlayerCard').innerHTML = '';
      document.getElementById('teamsRow').innerHTML = '';
      document.getElementById('bidInfo').innerHTML = '';
      return;
    }
    document.getElementById('auctionPlayerCard').innerHTML = `
      <div class="flex flex-col items-center">
        <img src="${pl.photo}" class="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 mb-4">
        <div class="font-extrabold text-2xl text-yellow-400">${pl.name}</div>
        <div class="text-gray-200 text-lg my-2">Age: ${pl.age}</div>
        <div class="text-gray-300 text-lg">Role: ${pl.role}</div>
        <div class="text-green-400 text-xl mt-2 font-bold">Base Price: ₹${pl.basePrice || 0}</div>
      </div>
    `;
  }
  function renderBidInfo() {
    let pl = playerOrder[currentIdx];
    if (!pl) return;
    let current = `Current Bid: ₹${bidAmount} `;
    current += biddingTeamIdx !== null ? `| by <span class="text-yellow-300 font-bold">${teams[biddingTeamIdx].name}</span>` : '';
    document.getElementById('bidInfo').innerHTML = `<span class="text-2xl text-yellow-300">${pl.name}</span> | ${current}`;
  }
  function getBidStep(pl) {
    let role = (pl.role || "").trim();
    if (role === "Batsman") return Number(auctionData.batsmanBidIncrease) || 100;
    if (role === "Bowler") return Number(auctionData.bowlerBidIncrease) || 100;
    if (role === "All Rounder") return Number(auctionData.allRounderBidIncrease) || 100;
    return 100;
  }
  document.getElementById('bidUpBtn').onclick = function () {
    if (!auctionStarted || auctionOver) return;
    if (biddingTeamIdx === null) { alert("Select a team first to bid!"); return; }
    let pl = playerOrder[currentIdx], thisBase = Number(pl.basePrice) || 0, bidIncrease = getBidStep(pl);
    if (bidAmount === 0) bidAmount = thisBase;
    else bidAmount += bidIncrease;
    if (bidAmount > teamPurses[biddingTeamIdx]) {
      bidAmount -= bidIncrease;
      alert("Selected team doesn't have enough purse!"); return;
    }
    renderBidInfo(); saveAuctionState();
  };
  document.getElementById('bidDownBtn').onclick = function () {
    if (!auctionStarted || biddingTeamIdx === null) return;
    let pl = playerOrder[currentIdx], thisBase = Number(pl.basePrice) || 0, bidDecrease = getBidStep(pl);
    if (bidAmount - bidDecrease >= thisBase) {
      bidAmount -= bidDecrease; renderBidInfo(); saveAuctionState();
    }
  };
  document.getElementById('soldBtn').onclick = function () {
    if (!auctionStarted || auctionOver) return;
    if (biddingTeamIdx === null || bidAmount === 0) { alert("Please bid and select a team before selling."); return; }
    let pl = Object.assign({}, playerOrder[currentIdx]);
    pl.soldTo = teams[biddingTeamIdx].name; pl.finalBid = bidAmount;
    soldPlayers.push(pl); teamPurses[biddingTeamIdx] -= bidAmount;
    currentIdx++; bidAmount = 0; biddingTeamIdx = null;
    renderTeamsRow(); renderCurrentPlayer(); renderBidInfo(); updateStatusCounts(); saveAuctionState();
  };
  document.getElementById('unsoldBtn').onclick = function () {
    if (!auctionStarted || auctionOver) return;
    let pl = playerOrder[currentIdx];
    unsoldPlayers.push(pl);
    currentIdx++; bidAmount = 0; biddingTeamIdx = null;
    renderTeamsRow(); renderCurrentPlayer(); renderBidInfo(); updateStatusCounts(); saveAuctionState();
  };

  function startAuction() {
    if (auctionOver) { alert("THE AUCTION IS OVER"); return; }
    auctionStarted = true;
    document.getElementById('bidControls').style.display = '';
    updateStatusCounts(); saveAuctionState();
    renderTeamsRow(); renderCurrentPlayer(); renderBidInfo();
  }

  // Picker logic: exclude sold/unsold/respect cycles and roles
  function filterCurrentAvailablePlayers() {
    const soldNames = new Set(soldPlayers.map(p => p.name));
    const alreadyUnsoldNames = nowCyclingUnsold ? new Set() : new Set(unsoldPlayers.map(p => p.name));
    return allPlayers.filter(pl => !soldNames.has(pl.name) && !alreadyUnsoldNames.has(pl.name));
  }

  showOrderSelect();
  document.getElementById('sequenceBtn').onclick = function () {
    if (auctionOver) { alert("THE AUCTION IS OVER"); return; }
    hideOrderSelect();
    if (nowCyclingUnsold) {
      playerOrder = unsoldPlayers.slice();
      currentIdx = 0;
      unsoldPlayers = [];
    } else {
      playerOrder = filterCurrentAvailablePlayers();
      currentIdx = 0;
    }
    startAuction();
  };
  document.getElementById('categoryBtn').onclick = function () {
    if (auctionOver) { alert("THE AUCTION IS OVER"); return; }
    hideOrderSelect();
    if (nowCyclingUnsold) {
      playerOrder = unsoldPlayers.slice();
      currentIdx = 0;
      unsoldPlayers = [];
    } else {
      let available = filterCurrentAvailablePlayers();
      playerOrder = [];
      ROLE_PRIORITY.forEach(role => {
        playerOrder = playerOrder.concat(available.filter(pl => (pl.role || "").trim() === role));
      });
      playerOrder = playerOrder.concat(available.filter(pl => !ROLE_PRIORITY.includes((pl.role || "").trim())));
      currentIdx = 0;
    }
    startAuction();
  };

  // On direct load/resume: always reconstruct correct pool
  if (!auctionOver && (soldPlayers.length || unsoldPlayers.length || (currentIdx && currentIdx > 0))) {
    hideOrderSelect();
    if (nowCyclingUnsold) {
      playerOrder = unsoldPlayers.slice();
    } else {
      playerOrder = filterCurrentAvailablePlayers();
    }
    startAuction();
  }
  if (auctionOver) {
    showEndAuctionMsg();
    showOrderSelect();
    document.getElementById('sequenceBtn').onclick = function(){ alert("THE AUCTION IS OVER"); };
    document.getElementById('categoryBtn').onclick = function(){ alert("THE AUCTION IS OVER"); };
  }
});
