document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const auctionId = params.get("auctionId");

  const auctionData = JSON.parse(localStorage.getItem(auctionId) || "{}");
  document.getElementById("viewTitle").textContent =
    (auctionData.name || "Auction") + " - Teams & Players";

  const teams = JSON.parse(localStorage.getItem('teams_' + auctionId) || "[]");
  const container = document.getElementById('teamsContainer');

  if (!teams.length) {
    container.innerHTML = '<p class="text-center text-gray-300 mt-10">No teams added yet.</p>';
    return;
  }

  const ROLE_SECTIONS = [
    { key: 'Batsman', label: 'Batsman' },
    { key: 'All Rounder', label: 'All Rounders' },
    { key: 'Bowler', label: 'Bowlers' },
    { key: 'Wicket Keeper Batsman', label: 'Wicketkeeper Batsmen' }
  ];

  teams.forEach(team => {
    const teamKey = 'soldPlayers_' + auctionId + '_' + team.name;
    const soldList = JSON.parse(localStorage.getItem(teamKey) || "[]");

    let html = `
      <div class="glass p-6">
        <div class="flex items-center mb-4">
          <img src="${team.icon}" class="w-12 h-12 rounded-full object-cover border-2 border-yellow-300 mr-4">
          <div>
            <div class="text-xl font-extrabold text-yellow-300">${team.name}</div>
            <div class="text-gray-300 text-sm">Owner: ${team.owner || '-'}</div>
            <div class="text-gray-500 text-xs">Captain: ${team.captain || '-'}</div>
          </div>
        </div>
    `;

    if (!soldList.length) {
      html += `<p class="text-gray-400 italic mb-2">No players bought yet.</p>`;
    }

    ROLE_SECTIONS.forEach(section => {
      const playersByRole = soldList.filter(p => (p.role || '').trim() === section.key);
      html += `
        <div class="mt-4">
          <div class="text-lg font-bold text-white border-b border-gray-600 pb-1 mb-2">
            ${section.label}
          </div>
      `;
      if (!playersByRole.length) {
        html += `<p class="text-gray-500 text-sm mb-1">No ${section.label.toLowerCase()} bought yet.</p>`;
      } else {
        playersByRole.forEach(p => {
          html += `
            <div class="flex items-center gap-3 mb-2 bg-gray-800 bg-opacity-70 rounded-lg p-2">
              <img src="${p.photo}" class="w-10 h-10 rounded-full object-cover border border-yellow-300">
              <div class="flex-1">
                <div class="text-yellow-200 font-semibold">${p.name}</div>
                <div class="text-gray-400 text-xs">Role: ${p.role}</div>
              </div>
              <div class="text-green-400 font-bold text-sm">₹${p.finalBid || p.basePrice || 0}</div>
            </div>
          `;
        });
      }
      html += `</div>`;
    });

    html += `</div>`; // glass

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper.firstElementChild);
  });
});
