document.addEventListener("DOMContentLoaded", function () {

  const startAuctionBtn = document.getElementById('startAuctionBtn');
if (startAuctionBtn) {
  startAuctionBtn.addEventListener('click', function() {
    // Pass the auctionId in the URL to the live auction page
    window.location.href = `auction-start.html?auctionId=${auctionId}`;
  });
}

  // -------------------------
  // SIGNUP
  // -------------------------
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const username = document.getElementById("newUsername").value.trim();
      const password = document.getElementById("newPassword").value.trim();
      const signupMsg = document.getElementById("signupMsg");
      let users = JSON.parse(localStorage.getItem("users")) || {};
      if (users[username]) {
        signupMsg.textContent = "❌ Username already exists!";
        signupMsg.className = "error";
        return;
      }
      users[username] = password;
      localStorage.setItem("users", JSON.stringify(users));
      signupMsg.textContent = "✅ Sign up successful! You can now log in.";
      signupMsg.className = "success";
      signupForm.reset();
    });
  }

  // -------------------------
  // LOGIN
  // -------------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const loginMsg = document.getElementById("loginMsg");
      let users = JSON.parse(localStorage.getItem("users")) || {};
      if (users[username] === password) {
        localStorage.setItem("currentUser", username);
        window.location.href = "landing.html";
      } else {
        loginMsg.textContent = "❌ Invalid username or password.";
        loginMsg.className = "error";
      }
    });
  }

  // -------------------------
  // HOST AUCTION PAGE LOGIC
  // -------------------------
  const tournamentForm = document.getElementById("tournamentForm");
  if (tournamentForm) {
    tournamentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const uniqueId = "AUC" + Math.floor(Math.random() * 1000000);
      const tournamentData = {
        name: document.getElementById("tournamentName").value,
        city: document.getElementById("city").value,
        place: document.getElementById("place").value,
        organizerName: document.getElementById("organizerName").value,
        organizerNumber: document.getElementById("organizerNumber").value,
        organizerEmail: document.getElementById("organizerEmail").value,
        auctionType: document.getElementById("auctionType").value,
        ballType: document.getElementById("ballType").value,
        matchLength: document.getElementById("matchLength").value,
        purseLimit: document.getElementById("purseLimit").value,
        batsmanMinBid: document.getElementById("batsmanMinBid").value,
        bowlerMinBid: document.getElementById("bowlerMinBid").value,
        allRounderMinBid: document.getElementById("allRounderMinBid").value,
        batsmanBidIncrease: document.getElementById("batsmanBidIncrease").value,
        bowlerBidIncrease: document.getElementById("bowlerBidIncrease").value,
        allRounderBidIncrease: document.getElementById("allRounderBidIncrease").value,
        playersPerTeam: document.getElementById("playersPerTeam").value,
        auctionDate: document.getElementById("auctionDate").value,
        createdBy: localStorage.getItem("currentUser") || "Unknown"
      };
      localStorage.setItem(uniqueId, JSON.stringify(tournamentData));
      document.getElementById("uniqueIdDisplay").innerText = `✅ Your Auction ID: ${uniqueId}`;
      tournamentForm.reset();
      localStorage.setItem("auctionScheduled", "yes");
    });

    // Proceed button logic for host-auction page
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', function() {
        const scheduled = localStorage.getItem('auctionScheduled');
        if (!scheduled || scheduled !== "yes") {
          alert('Please fill and schedule your tournament details before proceeding.');
        } else {
          localStorage.removeItem('auctionScheduled');
          window.location.href = 'my-auctions.html';
        }
      });
    }
  }

  // -------------------------
  // JOIN AUCTION PAGE LOGIC
  // -------------------------
  const joinForm = document.getElementById("joinAuctionForm");
  if (joinForm) {
    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const enteredId = document.getElementById("auctionIdInput").value.trim();
      const auctionData = localStorage.getItem(enteredId);
      const joinMessage = document.getElementById("joinMessage");
      if (auctionData) {
        const data = JSON.parse(auctionData);
        joinMessage.innerHTML = `
          ✅ Successfully joined auction <strong>${data.name}</strong><br>
          📍 Location: ${data.city}, ${data.place}<br>
          📅 Auction Date: ${data.auctionDate}<br>
          👤 Organizer: ${data.organizerName} (${data.organizerNumber})
        `;
        joinMessage.className = "text-green-400 mt-4 font-semibold";
      } else {
        joinMessage.textContent = "❌ Invalid Auction ID!";
        joinMessage.className = "text-red-400 mt-4 font-semibold";
      }
    });
  }

  // -------------------------
  // MY AUCTIONS PAGE LOGIC
  // -------------------------
  const myAuctionsList = document.getElementById("myAuctionsList");
  if (myAuctionsList) {
    const currentUser = localStorage.getItem("currentUser") || "Unknown";
    const auctions = [];
    for (let key in localStorage) {
      if (key.startsWith("AUC")) {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.createdBy === currentUser) {
          auctions.push({ ...data, id: key });
        }
      }
    }
    if (auctions.length === 0) {
      myAuctionsList.innerHTML = "<p>No scheduled auctions found.</p>";
    } else {
      auctions.forEach(auc => {
        const div = document.createElement('div');
        div.className = "p-4 bg-gray-800 rounded shadow cursor-pointer hover:bg-gray-700";
        div.innerHTML = `<strong>${auc.name}</strong> — Players/Team: ${auc.playersPerTeam || "-"}<br>
          <span class="text-sm text-gray-400">${auc.city}, ${auc.place} | ${auc.auctionDate}</span>`;
        div.onclick = () => {
          window.location.href = `auction-options.html?auctionId=${auc.id}`;
        };
        myAuctionsList.appendChild(div);
      });
    }
  }

  // -------------------------
  // AUCTION OPTIONS PAGE LOGIC (Per Tournament)
  // -------------------------
  // Get auction/tournament ID from URL for per-tournament data
  const params = new URLSearchParams(window.location.search);
  const auctionId = params.get("auctionId");

  // Tournament Info on Top
  const auctionHeaderInfo = document.getElementById("auctionHeaderInfo");
  if (auctionHeaderInfo && auctionId) {
    const auctionData = localStorage.getItem(auctionId);
    if (auctionData) {
      const data = JSON.parse(auctionData);
      auctionHeaderInfo.innerHTML = `
        <img src="https://cdn.vectorstock.com/i/1000v/74/80/cricket-tournament-sport-logo-emblem-vector-45077480.jpg" class="w-20 h-20 rounded-full" alt="Tournament Logo" />
        <div>
          <div class="text-2xl font-bold">${data.name}</div>
          <div class="text-gray-300 mt-2">📅 ${data.auctionDate} &nbsp;&nbsp; | Players/Team: ${data.playersPerTeam || "-"}</div>
          <div class="text-gray-400 mt-1 font-semibold">Organizer: ${data.organizerName}</div>
        </div>
        <div class="ml-auto flex gap-4">
          <span class="bg-yellow-600 text-black font-bold px-5 py-2 rounded-full">Free/-</span>
          <button class="bg-red-600 font-bold px-5 py-2 rounded shadow">Upgrade Now</button>
        </div>
      `;
    }
  }

  // Tab navigation and plus for teams/players
  function setTeamsPlusVisibility(visible) {
    const teamBtn = document.getElementById('openTeamModal');
    if (teamBtn) teamBtn.style.display = visible ? 'flex' : 'none';
  }
  function setPlayersPlusVisibility(visible) {
    const playerBtn = document.getElementById('openPlayerModal');
    if (playerBtn) playerBtn.style.display = visible ? 'flex' : 'none';
  }
  const tabs = document.querySelectorAll('.nav-tab');
  if (tabs.length > 0) {
    tabs.forEach(function (btn, idx) {
      btn.onclick = function() {
        tabs.forEach(b => b.classList.remove('active-nav'));
        btn.classList.add('active-nav');
        let ids = ['teams','players','mvp','sponsors','about'];
        ids.forEach(id => {
          const tabSection = document.getElementById('tab-content-' + id);
          if(tabSection) tabSection.classList.add('hidden');
        });
        const activeSection = document.getElementById('tab-content-' + ids[idx]);
        if(activeSection) activeSection.classList.remove('hidden');
        setTeamsPlusVisibility(idx === 0);
        setPlayersPlusVisibility(idx === 1);
        if(idx===0){ renderTeams();}
        if(idx===1){ renderPlayers();}
      };
    });
    setTeamsPlusVisibility(true);
    setPlayersPlusVisibility(false);
  }

  // Add Team Modal Logic
  const openModalBtn = document.getElementById('openTeamModal');
  const closeModalBtn = document.getElementById('closeTeamModal');
  const addTeamModal = document.getElementById('addTeamModal');
  if (openModalBtn) openModalBtn.onclick = () => addTeamModal.classList.remove('hidden');
  if (closeModalBtn) closeModalBtn.onclick = () => addTeamModal.classList.add('hidden');

  const addTeamForm = document.getElementById('addTeamForm');
  if (addTeamForm && auctionId) {
    addTeamForm.onsubmit = function(e) {
      e.preventDefault();
      const team = {
        name: document.getElementById('teamName').value,
        icon: document.getElementById('teamIcon').value,
        owner: document.getElementById('teamOwner').value,
        captain: document.getElementById('teamCaptain').value,
      };
      let teams = JSON.parse(localStorage.getItem('teams_' + auctionId)) || [];
      teams.push(team);
      localStorage.setItem('teams_' + auctionId, JSON.stringify(teams));
      addTeamForm.reset();
      addTeamModal.classList.add('hidden');
      renderTeams();
    };
  }
  function renderTeams() {
  const teamsDiv = document.getElementById('teamsListSection');
  if (!auctionId || !teamsDiv) return;
  let teams = JSON.parse(localStorage.getItem('teams_' + auctionId)) || [];

  // Get current purse per team as updated by live auction
  let auctionState = JSON.parse(localStorage.getItem('auctionState_' + auctionId) || "{}");
  let purseArray = auctionState.teamPurses || [];

  // Fallback for initial rendering before auction starts
  let purseLimit = "";
  const auctionData = localStorage.getItem(auctionId);
  if(auctionData){
    const data = JSON.parse(auctionData);
    purseLimit = data.purseLimit || "";
  }

  if (teams.length === 0) {
    teamsDiv.innerHTML = '<p class="text-center text-gray-300 mt-8">No teams added yet.</p>';
  } else {
    teamsDiv.innerHTML = teams.map((team, idx) => `
      <div class="flex items-center gap-6 m-4 bg-gray-800 p-4 rounded shadow">
        <img src="${team.icon}" class="w-14 h-14 rounded-full object-cover border-2 border-yellow-300">
        <div>
          <div class="font-extrabold text-lg text-yellow-300">${team.name}</div>
          <div class="text-gray-200 text-md">Owner: ${team.owner}</div>
          <div class="text-gray-400 text-sm">Captain: ${team.captain}</div>
          <div class="text-green-400 text-md mt-1 font-bold">
            Purse Left: ₹ ${purseArray[idx] !== undefined ? purseArray[idx] : purseLimit}
          </div>
        </div>
      </div>
    `).join('');
  }
}

  // Add Player Modal Logic
  const openPlayerModal = document.getElementById('openPlayerModal');
  const closePlayerModal = document.getElementById('closePlayerModal');
  const addPlayerModal = document.getElementById('addPlayerModal');
  if (openPlayerModal) openPlayerModal.onclick = () => addPlayerModal.classList.remove('hidden');
  if (closePlayerModal) closePlayerModal.onclick = () => addPlayerModal.classList.add('hidden');

  const addPlayerForm = document.getElementById('addPlayerForm');
  if (addPlayerForm && auctionId) {
    addPlayerForm.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('playerName').value;
      const age = document.getElementById('playerAge').value;
      const basePrice = document.getElementById('playerBasePrice').value; 
      const role = document.getElementById('playerRole').value;
      const photoInput = document.getElementById('playerPhoto');
      if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const photoData = event.target.result;
          const player = { name, age, role, basePrice, photo: photoData };
          let players = JSON.parse(localStorage.getItem('players_' + auctionId)) || [];
          players.push(player);
          localStorage.setItem('players_' + auctionId, JSON.stringify(players));
          addPlayerForm.reset();
          addPlayerModal.classList.add('hidden');
          renderPlayers();
        };
        reader.readAsDataURL(photoInput.files[0]);
      }
    };
  }
  function renderPlayers() {
    const playersDiv = document.getElementById('playersListSection');
    if (!auctionId || !playersDiv) return;
    let players = JSON.parse(localStorage.getItem('players_' + auctionId)) || [];
    if (players.length === 0) {
      playersDiv.innerHTML = '<p class="text-center text-gray-300 mt-8">No players added yet.</p>';
    } else {
      playersDiv.innerHTML = players.map(player => `
        <div class="flex items-center gap-6 m-4 bg-gray-800 p-4 rounded shadow">
          <img src="${player.photo}" class="w-14 h-14 rounded-full object-cover border-2 border-yellow-300">
          <div>
            <div class="font-extrabold text-lg text-yellow-300">${player.name}</div>
            <div class="text-gray-200 text-md">Age: ${player.age}</div>
            <div class="text-gray-400 text-sm">Role: ${player.role}</div>
            <div class="text-gray-400 text-sm">Base Price: ${player.basePrice}</div>
          </div>   
        </div>
      `).join('');  
    }
  }

  // ---- On page load: render both teams and players (if those tabs exist)
  renderTeams();
  renderPlayers();
});
