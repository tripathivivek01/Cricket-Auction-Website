document.addEventListener("DOMContentLoaded", function () {
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
  // HOST AUCTION (if on host-auction.html)
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
    });
  }

  // -------------------------
  // JOIN AUCTION (if on join-auction.html)
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
          auctions.push({...data, id: key});
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
  // AUCTION OPTIONS PAGE LOGIC
  // -------------------------
  const auctionDetails = document.getElementById("auctionDetails");
  if (auctionDetails) {
    const params = new URLSearchParams(window.location.search);
    const auctionId = params.get("auctionId");
    const auctionData = localStorage.getItem(auctionId);
    if (auctionData) {
      const data = JSON.parse(auctionData);
      auctionDetails.innerHTML = `
        <div class="flex items-center mb-4">
          <img src="https://img.freepik.com/free-vector/trophy-background-golden-cup_1017-8853.jpg?w=826&t=st=1695120725~exp=1695121325~hmac=2da3af44c0d1dfb47f008bf94836aded1e902f9b51b4a4c84e9b8158e60e664f"
            alt="Tournament Logo" class="w-20 h-20 rounded-full mr-4 border-4 border-yellow-400">
          <div>
            <h1 class="text-2xl font-bold">${data.name}</h1>
            <p class="text-sm flex items-center text-gray-300">
              <span class="mr-6">📅 ${data.auctionDate}</span>
              <span>👥 ${data.playersPerTeam || "-"} Players/Team</span>
            </p>
          </div>
        </div>
        <div class="mb-6">
          <span class="inline-block bg-yellow-500 text-black rounded px-3 py-1 text-sm mr-2">Free/-</span>
          <button class="bg-red-700 hover:bg-red-900 text-white rounded px-4 py-2 font-bold border-2 border-yellow-400">Upgrade Now</button>
        </div>
        <div class="flex border-b border-gray-700 mb-4">
          <a class="px-4 py-2 border-b-2 border-yellow-400 font-semibold cursor-pointer">TEAMS</a>
          <a class="px-4 py-2 text-gray-400 cursor-pointer">PLAYERS</a>
          <a class="px-4 py-2 text-gray-400 cursor-pointer">MVP</a>
          <a class="px-4 py-2 text-gray-400 cursor-pointer">SPONSORS</a>
          <a class="px-4 py-2 text-gray-400 cursor-pointer">ABOUT</a>
        </div>
        <div class="bg-white text-gray-700 rounded p-4">
          <p>Export sold players/teams via excel file? <a href="#" class="text-blue-600 underline">Tap Here</a></p>
        </div>
        <div class="text-center text-black mt-10">
          <p>There is no any team listed</p>
          <p>Click the + (plus) button bottom to Add team.</p>
        </div>
        <div class="flex justify-center gap-8 mt-10">
          <button class="bg-red-700 hover:bg-red-900 text-white rounded px-8 py-3 font-bold mr-4">START AUCTION</button>
          <button class="bg-red-700 hover:bg-red-900 text-white rounded px-8 py-3 font-bold">VIEW AUCTION</button>
        </div>
        <button style="position:fixed;bottom:32px;right:32px;" class="w-16 h-16 bg-red-700 hover:bg-red-900 text-4xl text-white rounded-full shadow flex items-center justify-center">+</button>
      `;
    } else {
      auctionDetails.textContent = "Auction not found!";
    }
  }
});



